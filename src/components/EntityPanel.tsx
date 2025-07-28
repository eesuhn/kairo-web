import React from 'react';
import { X, FileText } from 'lucide-react';
import { Note } from '../types';
import { getReadableEntityLabel } from '../utils/entityLabels';

interface EntityPanelProps {
  entityType: string;
  notes: Note[];
  onClose: () => void;
  onNoteSelect: (note: Note) => void;
  overlay?: boolean;
}

export const EntityPanel: React.FC<EntityPanelProps> = ({
  entityType,
  notes,
  onClose,
  onNoteSelect,
  overlay = false,
}) => {
  return (
    <div
      className={`${
        overlay
          ? 'animate-slidein fixed right-0 z-40 flex flex-col border-l-2 border-gray-200 bg-white backdrop-blur-sm'
          : 'flex w-80 flex-col border-l border-gray-700/50 bg-gray-900/90 backdrop-blur-sm'
      } transition-all duration-300`}
      style={
        overlay
          ? {
              width: '20rem',
              minWidth: '20rem',
              top: '80px',
              height: 'calc(100vh - 64px)',
            }
          : {}
      }
    >
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black">
          {getReadableEntityLabel(entityType)}
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 transition-all hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onNoteSelect(note)}
              className="group w-full rounded-lg p-3 text-left transition-all hover:bg-gray-200"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-2 h-4 w-4 flex-shrink-0 text-black" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-black">
                    {note.title}
                  </div>
                  <div className="ml-[2px] mt-[2px] line-clamp-2 text-justify text-xs text-gray-400">
                    {note.abstractive_summary.slice(0, 36)}...
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
