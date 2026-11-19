import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center justify-center gap-2 rounded-sm border border-[#e5a94c]/55 bg-[#e5a94c]/15 hover:bg-[#e5a94c]/25 text-[#f7dca5] font-medium uppercase tracking-[0.12em] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-sm border border-[#e5a94c]/45 bg-[#0a1316]/85 hover:border-[#e5a94c]/80 text-[#f2d79c] font-medium uppercase tracking-[0.12em] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            compact ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
            style={{ backgroundColor: 'rgba(4, 8, 10, 0.88)' }}
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-sm border border-[#e5a94c]/45 p-5 space-y-3"
              style={{ backgroundColor: '#091114' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[#f4ede0]">Install MOKSHA</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#9eb2b4] hover:text-white cursor-pointer"
                  aria-label="Close install instructions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#c7d2d4] leading-relaxed">
                1. Tap the <strong className="text-[#f3c974]">Share</strong> icon in Safari.
                <br />
                2. Tap <strong className="text-[#f3c974]">Add to Home Screen</strong> for fullscreen
                offline play.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-sm border border-[#e5a94c]/50 text-[10px] font-medium uppercase tracking-wider text-[#f7dfb0]"
      style={{ backgroundColor: 'rgba(10, 14, 16, 0.92)' }}
    >
      <WifiOff className="w-3 h-3 text-[#e5a94c]" />
      <span>Offline Mode · Ready to Play</span>
    </div>
  );
};
