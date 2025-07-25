import React, { useState, useEffect, useCallback } from 'react';
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
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [entityPanelNotes, setEntityPanelNotes] = useState<Note[]>([]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await storage.init();
        await loadNotes();
        await checkApiStatus();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to initialize the application. Please refresh the page.');
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
        setNotes(prev => [...prev, note]);
        setSelectedNote(note);
        setShowUploadModal(false);
      } else {
        throw new Error(result.message || 'Processing failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process file');
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
    setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
    setSelectedNote(updatedNote);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await storage.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      setError('Failed to delete note');
    }
  };

  const handleEntityTypeClick = (entityType: string) => {
    const relatedNotes = notes.filter(note => 
      note.entities.some(entity => entity.label === entityType)
    );
    setSelectedEntityType(entityType);
    setEntityPanelNotes(relatedNotes);
  };

  const handleSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);
  
  useKeyboard(handleSearch);

  return (
    <div className="h-screen bg-gray-950 text-white flex overflow-hidden">
      {apiStatus === 'disconnected' && (
        <div className="absolute top-4 right-4 z-50 bg-red-500/10 border border-red-500/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">API Server Disconnected</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
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

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div />
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVisualization(!showVisualization)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                  ${showVisualization
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                <BarChart3 className="w-4 h-4" />
                Visualize
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Note
              </button>
              
              <div className={`
                w-2 h-2 rounded-full
                ${apiStatus === 'connected' ? 'bg-green-500' : 
                  apiStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'}
              `} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden min-h-0 flex">
          {showVisualization ? (
            <div className="flex-1 h-full p-6">
              <EntityVisualization
                notes={notes}
                onNoteSelect={handleNoteSelect}
              />
            </div>
          ) : selectedNote ? (
            <>
              <div className={`transition-all duration-300 ${selectedEntityType ? 'flex-1' : 'w-full'}`}>
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
                />
              )}
            </>
          ) : (
            <div className="flex-1 h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to Kairo Notes</h2>
                <p className="text-gray-400 mb-8">
                  {notes.length > 0 
                    ? "Select a note from the sidebar to view it."
                    : "Upload your first document to get started with AI-powered note taking."
                  }
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