import React, { useMemo } from 'react';
import { FileText, Search, Trash2 } from 'lucide-react';
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
  const { displayNotes, recentNotes } = useMemo(() => {
    const displayNotes = notes.slice(0, 10);
    const recentNotes =
      notes.length > 10
        ? notes
            .sort(
              (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime()
            )
            .slice(0, 3)
        : [];

    return { displayNotes, recentNotes };
  }, [notes]);

  return (
    <div className="flex w-80 flex-col border-r border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
      <div className="border-b border-gray-700/50 px-6 py-4">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-3 rounded-xl bg-gray-800/50 p-3 text-gray-300 transition-all hover:bg-gray-800/70 hover:text-white"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search notes...</span>
          <span className="ml-auto rounded bg-gray-700 px-2 py-1 text-xs">
            ⌘K
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <div className="space-y-1">
            {displayNotes.map((note) => (
              <div key={note.id} className="group relative">
                <button
                  onClick={() => onNoteSelect(note)}
                  className={`flex w-full items-center gap-3 rounded-lg p-4 text-left transition-all ${
                    selectedNoteId === note.id
                      ? 'rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 backdrop-blur-lg'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  } `}
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{note.title}</div>
                    <div className="truncate text-xs text-gray-500">
                      {note.abstractive_summary.slice(0, 50)}...
                    </div>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-700 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {recentNotes.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
              Recent
            </h2>
            <div className="space-y-1">
              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onNoteSelect(note)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all ${
                    selectedNoteId === note.id
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  } `}
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
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
