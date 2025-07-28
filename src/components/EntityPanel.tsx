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
          ? 'animate-slidein fixed right-0 z-40 flex flex-col border-l border-gray-700/50 bg-gray-900/90 shadow-2xl backdrop-blur-sm'
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
      <div className="flex items-center justify-between border-b border-gray-700/50 p-4">
        <h3 className="text-lg font-semibold text-white">
          {getReadableEntityLabel(entityType)}
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 transition-all hover:bg-gray-700 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onNoteSelect(note)}
              className="group w-full rounded-lg bg-gray-800/50 p-3 text-left transition-all hover:bg-gray-700/50"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white transition-colors group-hover:text-purple-300">
                    {note.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-justify text-xs text-gray-400">
                    {note.abstractive_summary.slice(0, 100)}...
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
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
