import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Note } from '../types';
import { EntityPill } from './EntityPill';
import { storage } from '../utils/storage';

interface NoteViewerProps {
  note: Note;
  onNoteUpdate: (note: Note) => void;
  onEntityTypeClick: (entityType: string) => void;
}

const getReadableEntityLabel = (label: string): string => {
  const labels: Record<string, string> = {
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
  return labels[label] || label.charAt(0).toUpperCase() + label.slice(1);
};

const formatExtractiveContent = (extractiveArray: string[]): string[] => {
  if (!Array.isArray(extractiveArray) || extractiveArray.length === 0)
    return [];

  const allText = extractiveArray.join(' ');
  const sentences = allText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  const paragraphs = [];

  for (let i = 0; i < sentences.length; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join(' ');
    if (paragraph.trim()) paragraphs.push(paragraph);
  }

  return paragraphs;
};
export const NoteViewer: React.FC<NoteViewerProps> = ({
  note,
  onNoteUpdate,
  onEntityTypeClick,
}) => {
  const [editedTitle, setEditedTitle] = useState(note.title);
  const [editedAbstract, setEditedAbstract] = useState(
    note.abstractive_summary
  );

  useEffect(() => {
    setEditedTitle(note.title);
    setEditedAbstract(note.abstractive_summary);
  }, [note]);

  const saveChanges = async (title: string, abstract: string) => {
    const updatedNote = {
      ...note,
      title,
      abstractive_summary: abstract,
      updated_at: new Date(),
      is_edited: true,
    };
    await storage.saveNote(updatedNote);
    onNoteUpdate(updatedNote);
  };

  const handleTitleBlur = () => {
    if (editedTitle !== note.title) {
      saveChanges(editedTitle, editedAbstract);
    }
  };

  const handleAbstractBlur = () => {
    if (editedAbstract !== note.abstractive_summary) {
      saveChanges(editedTitle, editedAbstract);
    }
  };

  const entityTypes = new Set<string>();
  note.entities.forEach((entity) => {
    if (
      entity.label.toLowerCase() === 'misc' ||
      entity.label.toLowerCase() === 'miscellaneous'
    )
      return;
    entityTypes.add(entity.label);
  });

  const extractiveContent = formatExtractiveContent(note.extractive_summary);

  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension!.length - 4
    );
    return `${truncatedName}...${extension}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8 pb-16">
          <div className="mb-4 max-w-4xl">
            <textarea
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-4xl font-bold bg-transparent text-white outline-none border-none resize-none placeholder-gray-500 leading-tight break-words max-w-full"
              placeholder="Untitled"
              rows={1}
            />

            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
              <div className="flex items-center gap-2 pl-1">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">
                  {note.created_at &&
                    note.created_at
                      .toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                      })
                      .replace(/ (\d{2})$/, " '$1")}
                </span>
              </div>
              {note.file_info && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                  {truncateFilename(note.file_info.filename)}
                </span>
              )}
            </div>
          </div>

          {entityTypes.size > 0 && (
            <div className="mb-10">
              <div className="flex flex-wrap gap-2">
                {Array.from(entityTypes).map((entityType, index) => (
                  <button
                    key={index}
                    onClick={() => onEntityTypeClick(entityType)}
                  >
                    <EntityPill
                      entity={{
                        text: getReadableEntityLabel(entityType),
                        label: entityType,
                        start: 0,
                        end: 0,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              At a Glance&nbsp;&nbsp;👀
            </h2>
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={(e) =>
                setEditedAbstract(e.currentTarget.textContent || '')
              }
              onBlur={handleAbstractBlur}
              className="w-full bg-transparent text-gray-200 leading-relaxed text-lg outline-none border-none focus:bg-gray-900/20 rounded-lg px-2 transition-all"
              style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              {editedAbstract || 'Executive summary will appear here...'}
            </div>
          </div>

          <div className="border-t border-gray-500 my-10"></div>

          <div className="mb-8">
            {extractiveContent.length > 0 ? (
              <div className="space-y-4">
                {extractiveContent.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-gray-200 leading-relaxed text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 italic">
                No detailed content available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
