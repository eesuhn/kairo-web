import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileUploadModal } from './components/FileUploadModal';
import { NoteViewer } from './components/NoteViewer';
import { SearchModal } from './components/SearchModal';
import { EntityVisualization } from './components/EntityVisualization';
import { EntityPanel } from './components/EntityPanel';
import { Note } from './types';
import { storage } from './utils/storage';
import { apiClient } from './utils/api';
import { createNoteFromPipeline } from './utils/noteUtils';
import { useKeyboard } from './hooks/useKeyboard';
import { BarChart3, AlertCircle } from 'lucide-react';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<
    'checking' | 'connected' | 'disconnected'
  >('checking');
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(
    null
  );
  const [entityPanelNotes, setEntityPanelNotes] = useState<Note[]>([]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await storage.init();
        await loadNotes();
        await checkApiStatus();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError(
          'Failed to initialize the application. Please refresh the page.'
        );
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (notes.length === 0 && apiStatus === 'connected') {
      setShowUploadModal(true);
    }
  }, [notes.length, apiStatus]);

  const checkApiStatus = async () => {
    try {
      await apiClient.healthCheck();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  const loadNotes = async () => {
    try {
      const allNotes = await storage.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await apiClient.uploadFile(file);

      if (result.status === 'success') {
        const note = createNoteFromPipeline(result);
        await storage.saveNote(note);
        setNotes((prev) => [...prev, note]);
        setSelectedNote(note);
        setShowUploadModal(false);
      } else {
        throw new Error(result.message || 'Processing failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to process file'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setShowVisualization(false);
    setSelectedEntityType(null);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
    setSelectedNote(updatedNote);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await storage.deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      setError('Failed to delete note');
    }
  };

  const handleEntityTypeClick = (entityType: string) => {
    const relatedNotes = notes.filter((note) =>
      note.entities.some((entity) => entity.label === entityType)
    );
    setSelectedEntityType(entityType);
    setEntityPanelNotes(relatedNotes);
  };

  const handleSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  useKeyboard(handleSearch);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-white">
      {apiStatus === 'disconnected' && (
        <div className="absolute right-6 top-4 z-50 rounded-lg border border-red-500/20 bg-red-500/10 p-3 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">
              Server Disconnected
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 transform rounded-lg border border-red-500/20 bg-red-500/10 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Sidebar
        notes={notes}
        selectedNoteId={selectedNote?.id}
        onNoteSelect={handleNoteSelect}
        onDeleteNote={handleDeleteNote}
        onSearch={handleSearch}
      />

      <div className="flex flex-1 flex-col">
        <header className="h-20 px-4 pt-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVisualization(!showVisualization)}
                className={`flex items-center gap-2 font-medium transition-all duration-200 ${
                  showVisualization
                    ? 'border-b-2 border-black text-black hover:border-gray-400 hover:text-gray-400'
                    : 'text-black backdrop-blur-sm hover:bg-white/5 hover:text-gray-400'
                } `}
              >
                <BarChart3 className="h-4 w-4" />
                Visualize
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 rounded-md px-4 py-2 font-medium text-black backdrop-blur-sm transition-all duration-200 hover:bg-white/5 hover:text-gray-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Note
              </button>

              <div
                className={`mx-4 h-2 w-2 rounded-full ${
                  apiStatus === 'connected'
                    ? 'bg-green-500'
                    : apiStatus === 'disconnected'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                } `}
              />
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {showVisualization ? (
            <div className="h-full flex-1 p-6">
              <EntityVisualization
                notes={notes}
                onNoteSelect={handleNoteSelect}
              />
            </div>
          ) : selectedNote ? (
            <>
              <div className="w-full">
                <NoteViewer
                  note={selectedNote}
                  onNoteUpdate={handleNoteUpdate}
                  onEntityTypeClick={handleEntityTypeClick}
                />
              </div>
              {selectedEntityType && (
                <EntityPanel
                  entityType={selectedEntityType}
                  notes={entityPanelNotes}
                  onClose={() => setSelectedEntityType(null)}
                  onNoteSelect={handleNoteSelect}
                  overlay
                />
              )}
            </>
          ) : (
            <div className="flex h-full flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-bold">
                  ❒&nbsp;&nbsp;Welcome to Kairo&nbsp;&nbsp;❒
                </h2>
                <p className="mb-8 font-semibold text-gray-400">
                  {notes.length > 0
                    ? 'Select a note from the sidebar to view it.'
                    : 'Upload your first document to get started.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNoteSelect={(note) => {
          handleNoteSelect(note);
          setIsSearchOpen(false);
        }}
      />

      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileUpload={handleFileUpload}
        isProcessing={isProcessing}
      />
    </div>
  );
}

export default App;
