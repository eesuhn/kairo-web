import React from 'react';
import { X, FileText } from 'lucide-react';
import { Note } from '../types';

const getReadableEntityLabel = (label: string): string => {
  const entityLabels: Record<string, string> = {
    PER: 'Person',
    PERSON: 'Person',
    ORG: 'Organization',
    ORGANIZATION: 'Organization',
    LOC: 'Location',
    LOCATION: 'Location',
    GPE: 'Location',
    DATE: 'Date',
    TIME: 'Time',
    MONEY: 'Money',
    PERCENT: 'Percentage',
    field: 'Academic Field',
    task: 'Task',
    product: 'Product',
    algorithm: 'Algorithm',
    metrics: 'Metrics',
    programlang: 'Programming Language',
    conference: 'Conference',
    book: 'Book',
    award: 'Award',
    poem: 'Poem',
    event: 'Event',
    magazine: 'Magazine',
    literarygenre: 'Literary Genre',
    discipline: 'Discipline',
    enzyme: 'Enzyme',
    protein: 'Protein',
    chemicalelement: 'Chemical Element',
    chemicalcompound: 'Chemical Compound',
    astronomicalobject: 'Astronomical Object',
    academicjournal: 'Academic Journal',
    theory: 'Theory',
  };

  return entityLabels[label] || label.charAt(0).toUpperCase() + label.slice(1);
};

interface EntityPanelProps {
  entityType: string;
  notes: Note[];
  onClose: () => void;
  onNoteSelect: (note: Note) => void;
}

export const EntityPanel: React.FC<EntityPanelProps> = ({
  entityType,
  notes,
  onClose,
  onNoteSelect,
}) => {
  return (
    <div className="w-80 bg-gray-900/90 backdrop-blur-sm border-l border-gray-700/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-semibold text-white">
          {getReadableEntityLabel(entityType)}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <p className="text-sm text-gray-400">
            {notes.length} note{notes.length !== 1 ? 's' : ''} contain this
            entity type
          </p>
        </div>

        <div className="space-y-2">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onNoteSelect(note)}
              className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all group"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                    {note.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {note.abstractive_summary.slice(0, 100)}...
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
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
