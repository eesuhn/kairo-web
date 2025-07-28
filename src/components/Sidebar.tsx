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
  const { displayNotes } = useMemo(() => {
    const displayNotes = notes.slice(0, 10);

    return { displayNotes };
  }, [notes]);

  return (
    <div className="flex w-80 flex-col border-r backdrop-blur-sm">
      <div className="border-b border-gray-700/50 px-6 py-4">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-3 rounded-xl bg-gray-200 p-3 text-black transition-all hover:bg-gray-300"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search notes...</span>
          <span className="ml-auto rounded bg-gray-700 px-2 py-1 text-xs !text-white">
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
                  className={`flex w-full items-center gap-3 rounded-lg p-4 text-left text-black transition-all ${
                    selectedNoteId === note.id
                      ? 'rounded-lg bg-gray-200 p-3 backdrop-blur-lg'
                      : 'hover:bg-gray-200'
                  } `}
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {note.title.length > 26
                        ? note.title.slice(0, 26) + '...'
                        : note.title}
                    </div>
                    <div className="ml-[2px] mt-[2px] truncate text-xs text-gray-500">
                      {note.abstractive_summary.slice(0, 30)}...
                    </div>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  className="absolute right-2 top-2 rounded pr-1 pt-2 text-gray-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
