import React, { useState, useEffect, useCallback } from 'react';
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
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
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = async (result: SearchResult) => {
    const note = await storage.getNote(result.id);
    if (note) {
      onNoteSelect(note);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center p-4 border-b border-gray-700/50">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-2" />
                <p className="text-gray-400">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`
                      w-full flex items-center gap-3 p-4 text-left transition-all
                      ${
                        index === selectedIndex
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-gray-300 hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.snippet && (
                        <div className="text-sm text-gray-400 truncate mt-1">
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

          <div className="border-t border-gray-700/50 p-3 bg-gray-900/50">
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
