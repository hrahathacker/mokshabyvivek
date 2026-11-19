import React from 'react';
import { Maximize2, Minimize2, Map as MapIcon, X } from 'lucide-react';
import { GhostAIState, MinimapData } from '../game/types';

interface HaveliMinimapProps {
  mapData: MinimapData;
  ghostState: GhostAIState;
  isTouchDevice: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
}

// Convert world meters (-15..+15) into SVG blueprint coordinates (0..180)
const SIZE = 180;
const PAD = 10;
const INNER = SIZE - PAD * 2;
const toSvg = (worldCoord: number) => PAD + ((worldCoord + 15) / 30) * INNER;

export const HaveliMinimap: React.FC<HaveliMinimapProps> = ({
  mapData,
  ghostState,
  isTouchDevice,
  expanded,
  onToggleExpanded,
}) => {
  const px = toSvg(mapData.playerX);
  const pz = toSvg(mapData.playerZ);
  const playerDeg = (-mapData.playerYaw * 180) / Math.PI;

  const gx = toSvg(mapData.ghostX);
  const gz = toSvg(mapData.ghostZ);
  const isChasing = ghostState === 'chase';
  const isSearching = ghostState === 'investigate' || ghostState === 'search';

  const statusText = isChasing ? 'CHASING' : isSearching ? 'HUNTING' : 'PATROL';

  const renderSvgBlueprint = (svgClass: string) => (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={svgClass}
      role="img"
      aria-label={`Haveli floor map. Spirit is in ${mapData.ghostRoom}, ${mapData.ghostDistance} meters away.`}
    >
      {/* Background floor plate */}
      <rect x={PAD} y={PAD} width={INNER} height={INNER} fill="#081215" stroke="#456066" strokeWidth="1.6" />

      {/* Central Open Aangan Courtyard shading */}
      <rect
        x={toSvg(-5.2)}
        y={toSvg(-5.2)}
        width={toSvg(5.2) - toSvg(-5.2)}
        height={toSvg(5.2) - toSvg(-5.2)}
        fill="#0d1d22"
        stroke="#2c4a52"
        strokeWidth="0.9"
        strokeDasharray="2.5 2"
      />

      {/* Structural Interior Partition Walls */}
      <g stroke="#6c858a" strokeWidth="1.8" strokeLinecap="square">
        <line x1={toSvg(-7.3)} y1={toSvg(-7.5)} x2={toSvg(-1.7)} y2={toSvg(-7.5)} />
        <line x1={toSvg(1.7)} y1={toSvg(-7.5)} x2={toSvg(7.3)} y2={toSvg(-7.5)} />
        <line x1={toSvg(-7.3)} y1={toSvg(-7.6)} x2={toSvg(-7.3)} y2={toSvg(-10.4)} />
        <line x1={toSvg(-7.3)} y1={toSvg(-12.2)} x2={toSvg(-7.3)} y2={toSvg(-15)} />
        <line x1={toSvg(7.3)} y1={toSvg(-7.6)} x2={toSvg(7.3)} y2={toSvg(-10.4)} />
        <line x1={toSvg(7.3)} y1={toSvg(-12.2)} x2={toSvg(7.3)} y2={toSvg(-15)} />

        <line x1={toSvg(-7.3)} y1={toSvg(7.5)} x2={toSvg(-1.7)} y2={toSvg(7.5)} />
        <line x1={toSvg(1.7)} y1={toSvg(7.5)} x2={toSvg(7.3)} y2={toSvg(7.5)} />
        <line x1={toSvg(-7.3)} y1={toSvg(7.6)} x2={toSvg(-7.3)} y2={toSvg(10.4)} />
        <line x1={toSvg(-7.3)} y1={toSvg(12.2)} x2={toSvg(-7.3)} y2={toSvg(15)} />
        <line x1={toSvg(7.3)} y1={toSvg(7.6)} x2={toSvg(7.3)} y2={toSvg(10.4)} />
        <line x1={toSvg(7.3)} y1={toSvg(12.2)} x2={toSvg(7.3)} y2={toSvg(15)} />

        <line x1={toSvg(-7.5)} y1={toSvg(-6.6)} x2={toSvg(-7.5)} y2={toSvg(-2.0)} />
        <line x1={toSvg(-7.5)} y1={toSvg(2.0)} x2={toSvg(-7.5)} y2={toSvg(6.6)} />
        <line x1={toSvg(-15)} y1={toSvg(-7.3)} x2={toSvg(-10.2)} y2={toSvg(-7.3)} />
        <line x1={toSvg(-15)} y1={toSvg(7.3)} x2={toSvg(-10.2)} y2={toSvg(7.3)} />

        <line x1={toSvg(7.5)} y1={toSvg(-6.6)} x2={toSvg(7.5)} y2={toSvg(-2.0)} />
        <line x1={toSvg(7.5)} y1={toSvg(2.0)} x2={toSvg(7.5)} y2={toSvg(6.6)} />
        <line x1={toSvg(10.2)} y1={toSvg(-7.3)} x2={toSvg(15)} y2={toSvg(-7.3)} />
        <line x1={toSvg(10.2)} y1={toSvg(7.3)} x2={toSvg(15)} y2={toSvg(7.3)} />
      </g>

      {/* Room Micro-Labels */}
      <g
        fill="#6e8b90"
        fontSize="6.4"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        <text x={toSvg(0)} y={toSvg(-11.2)}>POOJA</text>
        <text x={toSvg(-11.3)} y={toSvg(0.4)}>BEDROOM</text>
        <text x={toSvg(11.3)} y={toSvg(0.4)}>KITCHEN</text>
        <text x={toSvg(0)} y={toSvg(11.8)}>STORE</text>
        <text x={toSvg(0)} y={toSvg(3.8)} fill="#5c797f" fontSize="5.6">AANGAN</text>
      </g>

      {/* Central Havan Kund */}
      <rect
        x={toSvg(-1.2)}
        y={toSvg(-1.2)}
        width={toSvg(1.2) - toSvg(-1.2)}
        height={toSvg(1.2) - toSvg(-1.2)}
        fill="#3a2414"
        stroke="#e5a94c"
        strokeWidth="1.1"
      />

      {/* Wooden Almirah Hiding Cupboards */}
      {mapData.almirahs.map((alm) => (
        <rect
          key={alm.id}
          x={toSvg(alm.x) - 2.6}
          y={toSvg(alm.z) - 2.6}
          width={5.2}
          height={5.2}
          fill="#634129"
          stroke="#b88456"
          strokeWidth="0.7"
        />
      ))}

      {/* Active Chapter Objectives */}
      {mapData.objectives.map((obj) => {
        const ox = toSvg(obj.x);
        const oz = toSvg(obj.z);
        const fill = obj.kind === 'seal' ? '#f2784b' : '#f5be58';
        return (
          <g key={obj.id} transform={`translate(${ox}, ${oz})`}>
            <circle r={obj.urgent ? 6.5 : 4.8} fill={fill} opacity="0.22" />
            <circle r={obj.urgent ? 3.2 : 2.6} fill={fill} stroke="#1a1206" strokeWidth="0.8" />
          </g>
        );
      })}

      {/* LIVE GHOST LOCATION MARKER */}
      <g transform={`translate(${gx}, ${gz})`}>
        <circle
          r={isChasing ? 12 : 9}
          fill={isChasing ? 'rgba(239, 68, 68, 0.28)' : 'rgba(220, 48, 56, 0.18)'}
          stroke={isChasing ? '#ff5555' : '#d8454a'}
          strokeWidth={isChasing ? '1.3' : '0.9'}
        />
        <polygon
          points="0,-5.5 4.4,0 0,5.5 -4.4,0"
          fill="#ff3b44"
          stroke="#ffe5e5"
          strokeWidth="0.9"
        />
      </g>

      {/* LIVE PLAYER MARKER + DIRECTIONAL FLASHLIGHT CONE */}
      <g transform={`translate(${px}, ${pz}) rotate(${playerDeg})`}>
        <polygon points="0,0 -7,-16 7,-16" fill="rgba(125, 211, 224, 0.24)" />
        <polygon
          points="0,-5 3.8,4 0,2 -3.8,4"
          fill="#7de2ee"
          stroke="#061215"
          strokeWidth="0.9"
        />
      </g>
    </svg>
  );

  // Expanded Tactical Map Modal Overlay (Landscape-friendly 2-column split on short Android screens)
  if (expanded) {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 pointer-events-auto"
        style={{ backgroundColor: 'rgba(4, 9, 11, 0.86)' }}
        onClick={onToggleExpanded}
      >
        <div
          className="w-full max-w-2xl max-h-[92dvh] rounded-sm border border-[#e5a94c]/45 p-3.5 sm:p-5 flex flex-col sm:flex-row gap-4 items-center"
          style={{ backgroundColor: '#081114' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: Square Live Blueprint */}
          <div className="w-[230px] sm:w-[270px] aspect-square shrink-0">
            {renderSvgBlueprint('w-full h-full block')}
          </div>

          {/* Right: Live Ghost Telemetry & Legend */}
          <div className="flex-1 w-full flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-[#e5a94c] shrink-0" />
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#f4ede0] tracking-wide">
                    Haveli Spirit Map
                  </h3>
                  <p className="text-[11px] font-mono-tabular text-[#95abae]">
                    Ghost: <span className="text-[#ff6b6b] font-semibold">{mapData.ghostRoom}</span> ({mapData.ghostDistance}m · {statusText})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleExpanded}
                className="p-1.5 text-[#9eb2b4] hover:text-white cursor-pointer"
                aria-label="Close expanded map"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#b4c4c6]">
              <div className="flex items-center gap-2 p-2 rounded-sm bg-[#0c171b] border border-white/10">
                <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[#ff3b44] border border-white/60 shrink-0" />
                <span>Ghost (Live)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-sm bg-[#0c171b] border border-white/10">
                <span className="inline-block w-2.5 h-2.5 bg-[#7de2ee] shrink-0" />
                <span>Your Position</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-sm bg-[#0c171b] border border-white/10">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f5be58] shrink-0" />
                <span>Chapter Task</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-sm bg-[#0c171b] border border-white/10">
                <span className="inline-block w-2.5 h-2.5 bg-[#634129] border border-[#b88456] shrink-0" />
                <span>Almirah Hide</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleExpanded}
              className="w-full py-2.5 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
            >
              Close Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compact Live HUD Minimap (Ultra-clean 104px radar tucked under top-right on Android landscape so thumb buttons stay 100% clear)
  return (
    <div
      className="pointer-events-auto absolute rounded-sm border transition-colors"
      style={{
        width: isTouchDevice ? '104px' : '178px',
        ...(isTouchDevice
          ? {
              top: 'calc(max(8px, var(--sat)) + 44px)',
              right: 'max(10px, var(--sar))',
            }
          : {
              bottom: '20px',
              right: '20px',
            }),
        backgroundColor: 'rgba(6, 12, 14, 0.84)',
        borderColor: isChasing ? 'rgba(239, 68, 68, 0.75)' : 'rgba(255, 255, 255, 0.14)',
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between px-1.5 py-0.5 sm:px-2 sm:py-1 border-b border-white/10">
        <span className="text-[9px] sm:text-[10px] font-mono-tabular uppercase tracking-[0.12em] text-[#a5b9bc]">
          {isTouchDevice ? 'Radar' : 'Haveli Map'}
        </span>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-[#9bb0b2] hover:text-[#f3bd60] transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
          aria-label="Expand Haveli Map"
          title="Expand Map (M)"
        >
          {!isTouchDevice && <span className="font-mono-tabular text-[9px] opacity-80">[M]</span>}
          {expanded ? <Minimize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
        </button>
      </div>

      {/* Live Floor Plan SVG */}
      <div className="p-1 sm:p-1.5 cursor-pointer" onClick={onToggleExpanded}>
        {renderSvgBlueprint('w-full h-auto block')}
      </div>

      {/* Live Ghost Location Footer */}
      <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 border-t border-white/10 flex items-center justify-between gap-1 text-[9px] sm:text-[10px] font-mono-tabular">
        <span
          className="truncate font-semibold"
          style={{ color: isChasing ? '#ff6464' : '#e0898d' }}
        >
          {isTouchDevice ? mapData.ghostRoom.split(' ')[0] : `Ghost: ${mapData.ghostRoom}`}
        </span>
        <span className="text-[#9eb2b4] shrink-0">{mapData.ghostDistance}m</span>
      </div>
    </div>
  );
};
