import React from 'react';
import { LoreNoteData } from '../game/types';

interface NoteModalProps {
  note: LoreNoteData;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ note, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center safe-pad p-3 sm:p-5 pointer-events-auto"
      style={{ backgroundColor: 'rgba(4, 8, 10, 0.86)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-sm border border-[#9d835b]/60 p-5 sm:p-7 shadow-2xl space-y-3.5 text-[#231912]"
        style={{
          background:
            'linear-gradient(155deg, #d7c5a1 0%, #c6af84 52%, #b59b6d 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#5e452e] border-b border-[#5e452e]/25 pb-2">
          <span>{note.room}</span>
          <span className="font-mono-tabular">{note.date}</span>
        </div>

        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2b1a10] leading-snug">
          {note.title}
        </h2>

        <p className="text-sm sm:text-base leading-relaxed italic text-[#2f1e14] font-serif">
          “{note.body}”
        </p>

        <div className="pt-3 border-t border-[#5e452e]/25 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#634931]">Tap outside or press Close</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-[#2a1b12] hover:bg-[#3d281b] text-[#f2e4ca] text-xs font-medium uppercase tracking-[0.16em] transition-colors cursor-pointer"
          >
            Close Note
          </button>
        </div>
      </div>
    </div>
  );
};
