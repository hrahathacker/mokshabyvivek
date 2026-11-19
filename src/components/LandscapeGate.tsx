import React from 'react';
import { Maximize2, Smartphone } from 'lucide-react';
import { enterAndroidLandscapeFullscreen } from '../game/androidViewport';

interface LandscapeGateProps {
  onDismiss: () => void;
}

export const LandscapeGate: React.FC<LandscapeGateProps> = ({ onDismiss }) => {
  const handleLockLandscape = async () => {
    await enterAndroidLandscapeFullscreen();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-auto"
      style={{
        background:
          'radial-gradient(circle at 50% 35%, rgba(28, 16, 12, 0.95) 0%, rgba(5, 9, 10, 0.99) 75%)',
      }}
    >
      <div className="max-w-xs w-full space-y-5 flex flex-col items-center">
        {/* Animated Rotating Android Phone Icon */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#e5a94c]/30" />
          <Smartphone className="w-11 h-11 text-[#e5a94c] animate-rotate-phone" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#e5a94c] font-medium">
            MOKSHA · Android Landscape Mode
          </p>
          <h2 className="font-display text-2xl font-bold text-[#f5efe2] tracking-wide">
            Rotate Your Phone
          </h2>
          <p className="text-sm text-[#c6d0d2] leading-relaxed">
            Phone ko <strong className="text-[#f4cb77]">Landscape (aada)</strong> ghumayein for full
            widescreen 3D horror controls &amp; Ghost Radar Map.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLockLandscape()}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Lock Landscape &amp; Fullscreen</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-[#8ea4a6] hover:text-[#f0ebe1] underline underline-offset-4 cursor-pointer py-1"
        >
          Continue in Portrait anyway
        </button>
      </div>
    </div>
  );
};
