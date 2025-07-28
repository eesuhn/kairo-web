import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { Note, SearchResult } from '../types';
import { storage } from '../utils/storage';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteSelect: (note: Note) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNoteSelect,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const notes = await storage.searchNotes(searchQuery);
      const searchResults: SearchResult[] = notes.map((note) => ({
        type: 'note',
        id: note.id,
        title: note.title,
        snippet: note.abstractive_summary.slice(0, 100) + '...',
      }));

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(delayedSearch);
  }, [query, performSearch]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    async (result: SearchResult) => {
      const note = await storage.getNote(result.id);
      if (note) {
        onNoteSelect(note);
      }
      onClose();
    },
    [onNoteSelect, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            results.length > 0 ? (prev + 1) % results.length : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            results.length > 0
              ? (prev - 1 + results.length) % results.length
              : 0
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pb-36 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border-2 border-gray-700/50 bg-white shadow-2xl backdrop-blur-sm">
          <div className="flex items-center border-b border-gray-700/50 p-4">
            <Search className="mr-3 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-lg text-black placeholder-gray-400 outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 transition-all hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                <p className="text-gray-400">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`flex w-full items-center gap-3 p-4 text-left text-gray-700 transition-all ${
                      index === selectedIndex
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-800/50'
                    } `}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{result.title}</div>
                      {result.snippet && (
                        <div className="mt-1 truncate text-sm text-gray-400">
                          {result.snippet}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-8 text-center text-gray-400">
                No notes found for "{query}"
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                Start typing to search your notes
              </div>
            )}
          </div>

          <div className="border-t border-gray-700/50 p-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
              <div>{results.length} results</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
