import React, { useRef, useState } from 'react';
import { Flashlight, Hand, Zap } from 'lucide-react';

interface MobileControlsProps {
  flashlightOn: boolean;
  isHiding: boolean;
  hasPrompt: boolean;
  onMoveVector: (x: number, y: number) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onSprintChange: (sprinting: boolean) => void;
  onInteract: () => void;
  onToggleFlashlight: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  flashlightOn,
  isHiding,
  hasPrompt,
  onMoveVector,
  onLookDelta,
  onSprintChange,
  onInteract,
  onToggleFlashlight,
}) => {
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [sprinting, setSprinting] = useState(false);

  const joyTouchId = useRef<number | null>(null);
  const joyOrigin = useRef({ x: 0, y: 0 });
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  const MAX_RADIUS = 38;

  const updateJoy = (cx: number, cy: number) => {
    const dx = cx - joyOrigin.current.x;
    const dy = cy - joyOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, MAX_RADIUS);
    const ang = Math.atan2(dy, dx);
    const ox = Math.cos(ang) * clamped;
    const oy = Math.sin(ang) * clamped;
    setKnobOffset({ x: ox, y: oy });
    onMoveVector(ox / MAX_RADIUS, -oy / MAX_RADIUS);
  };

  const handleJoyStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joyTouchId.current !== null) return;
    const t = e.changedTouches[0];
    joyTouchId.current = t.identifier;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateJoy(t.clientX, t.clientY);
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joyTouchId.current) {
        updateJoy(t.clientX, t.clientY);
      }
    }
  };

  const handleJoyEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId.current) {
        joyTouchId.current = null;
        setKnobOffset({ x: 0, y: 0 });
        onMoveVector(0, 0);
      }
    }
  };

  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchId.current !== null) return;
    const t = e.changedTouches[0];
    lookTouchId.current = t.identifier;
    lastLookPos.current = { x: t.clientX, y: t.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId.current) {
        const dx = (t.clientX - lastLookPos.current.x) * 1.48;
        const dy = (t.clientY - lastLookPos.current.y) * 1.32;
        lastLookPos.current = { x: t.clientX, y: t.clientY };
        onLookDelta(dx, dy);
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  const toggleSprint = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const next = !sprinting;
    setSprinting(next);
    onSprintChange(next);
  };

  return (
    <div className="fixed inset-0 z-15 pointer-events-none select-none">
      {/* Wide Landscape Touch-Drag Look Surface (center & right screen) */}
      <div
        className="pointer-events-auto absolute top-12 bottom-0 right-0 left-[32%] touch-none"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Left Virtual Movement Joystick (Android notch & gesture-bar safe) */}
      <div
        className="pointer-events-auto absolute w-26 h-26 rounded-full border border-white/25 flex items-center justify-center touch-none"
        style={{
          left: 'max(18px, var(--sal))',
          bottom: 'max(14px, var(--sab))',
          backgroundColor: 'rgba(6, 12, 14, 0.54)',
        }}
        onTouchStart={handleJoyStart}
        onTouchMove={handleJoyMove}
        onTouchEnd={handleJoyEnd}
        onTouchCancel={handleJoyEnd}
      >
        {/* Subtle cardinal direction markers */}
        <span className="pointer-events-none absolute top-1.5 w-1 h-1 rounded-full bg-white/30" />
        <span className="pointer-events-none absolute bottom-1.5 w-1 h-1 rounded-full bg-white/30" />
        <span className="pointer-events-none absolute left-1.5 w-1 h-1 rounded-full bg-white/30" />
        <span className="pointer-events-none absolute right-1.5 w-1 h-1 rounded-full bg-white/30" />

        <div
          className="w-10 h-10 rounded-full border"
          style={{
            borderColor: sprinting ? 'rgba(116, 206, 218, 0.9)' : 'rgba(229, 169, 76, 0.78)',
            backgroundColor: sprinting ? 'rgba(66, 152, 168, 0.36)' : 'rgba(229, 169, 76, 0.28)',
            transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          }}
        />
      </div>

      {/* Right-Thumb Curved Ergonomic Action Arc (Android Landscape FPS layout) */}
      {/* 1. Primary USE / HIDE / EXIT thumb button (lower-right corner) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
        className={`pointer-events-auto absolute w-16 h-16 rounded-full border flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider cursor-pointer touch-none active:scale-95 transition-transform ${
          hasPrompt || isHiding
            ? 'border-[#f0b450] text-[#fff2d6]'
            : 'border-white/25 text-[#c7d6d8]'
        }`}
        style={{
          right: 'max(18px, var(--sar))',
          bottom: 'max(14px, var(--sab))',
          backgroundColor:
            hasPrompt || isHiding ? 'rgba(184, 52, 38, 0.88)' : 'rgba(6, 12, 14, 0.72)',
        }}
      >
        <Hand className="w-5 h-5" />
        <span>{isHiding ? 'Exit' : 'Use'}</span>
      </button>

      {/* 2. TORCH button (left of USE button in thumb arc) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFlashlight();
        }}
        className={`pointer-events-auto absolute w-13 h-13 rounded-full border flex flex-col items-center justify-center gap-0.5 text-[9px] font-medium uppercase tracking-wider cursor-pointer touch-none active:scale-95 transition-transform ${
          flashlightOn
            ? 'border-[#e5a94c]/80 text-[#fae0ab]'
            : 'border-white/25 text-[#9aaeb0]'
        }`}
        style={{
          right: 'calc(max(18px, var(--sar)) + 76px)',
          bottom: 'max(16px, var(--sab))',
          backgroundColor: flashlightOn ? 'rgba(130, 82, 22, 0.72)' : 'rgba(6, 12, 14, 0.72)',
        }}
      >
        <Flashlight className="w-4 h-4" />
        <span>Torch</span>
      </button>

      {/* 3. RUN Sprint Toggle button (arced above-left of USE so thumb never cramps) */}
      <button
        type="button"
        onClick={toggleSprint}
        className={`pointer-events-auto absolute w-12 h-12 rounded-full border flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider cursor-pointer touch-none active:scale-95 transition-transform ${
          sprinting
            ? 'border-[#74c6d1] text-[#eef9fb]'
            : 'border-white/25 text-[#b7c7c9]'
        }`}
        style={{
          right: 'calc(max(18px, var(--sar)) + 52px)',
          bottom: 'calc(max(14px, var(--sab)) + 68px)',
          backgroundColor: sprinting ? 'rgba(42, 108, 120, 0.84)' : 'rgba(6, 12, 14, 0.72)',
        }}
      >
        <Zap className="w-3.5 h-3.5" />
        <span>{sprinting ? 'Fast' : 'Run'}</span>
      </button>
    </div>
  );
};
