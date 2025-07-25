import React, { useState } from 'react';
import { FileText, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { Note } from '../types';

interface SidebarProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote,
  onSearch,
}) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div className="w-80 bg-gray-900/80 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
      <div className="p-6 border-b border-gray-700/50">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl transition-all text-gray-300 hover:text-white"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search notes...</span>
          <span className="ml-auto text-xs bg-gray-700 px-2 py-1 rounded">
            ⌘K
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <div className="space-y-1">
            {notes.slice(0, 10).map((note) => (
              <div key={note.id} className="group relative">
                <button
                  onClick={() => onNoteSelect(note)}
                  className={`
                    w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left
                    ${
                      selectedNoteId === note.id
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }
                  `}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm">{note.title}</div>
                    <div className="truncate text-xs text-gray-500">
                      {note.abstractive_summary.slice(0, 50)}...
                    </div>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === note.id ? null : note.id);
                  }}
                  className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>

                {menuOpen === note.id && (
                  <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        onDeleteNote(note.id);
                        setMenuOpen(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg text-sm w-full"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {notes.length > 10 && (
          <div>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Recent
            </h2>
            <div className="space-y-1">
              {notes
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                )
                .slice(0, 3)
                .map((note) => (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note)}
                    className={`
                      w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left
                      ${
                        selectedNoteId === note.id
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                      }
                    `}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm">{note.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
