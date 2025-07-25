import React, { useState, useEffect, useRef } from 'react';
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

const formatExtractiveContent = (
  extractiveArray: string[],
  isEdited: boolean = false
): string => {
  if (!Array.isArray(extractiveArray) || extractiveArray.length === 0)
    return '';

  // If the note has been edited, or if it's a single-element array (indicating it's already formatted),
  // just return the content as-is
  if (
    isEdited ||
    (extractiveArray.length === 1 &&
      !extractiveArray[0].match(/^[^.!?]+[.!?]$/))
  ) {
    return extractiveArray.join(' ');
  }

  // Only apply 3-sentence grouping for initial raw sentence arrays
  // Join all sentences into one text
  const allText = extractiveArray.join(' ');

  // Split into sentences
  const sentences = allText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  // Group sentences into paragraphs (3 sentences each)
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join(' ');
    if (paragraph.trim()) paragraphs.push(paragraph);
  }

  // Return as a single string with paragraphs separated by double newlines
  return paragraphs.join('\n\n');
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
  const [editedExtractive, setEditedExtractive] = useState<string>('');

  // Track what we last saved to avoid unnecessary updates
  const lastSavedRef = useRef({
    title: note.title,
    abstract: note.abstractive_summary,
    extractive: formatExtractiveContent(
      note.extractive_summary,
      note.is_edited
    ),
  });

  const abstractRef = useRef<HTMLDivElement>(null);
  const extractiveRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Initialize content
  useEffect(() => {
    const formattedExtractive = formatExtractiveContent(
      note.extractive_summary,
      note.is_edited
    );
    setEditedTitle(note.title);
    setEditedAbstract(note.abstractive_summary);
    setEditedExtractive(formattedExtractive);

    // Update our saved reference
    lastSavedRef.current = {
      title: note.title,
      abstract: note.abstractive_summary,
      extractive: formattedExtractive,
    };
  }, [
    note.id,
    note.title,
    note.abstractive_summary,
    note.extractive_summary,
    note.is_edited,
  ]);

  // Auto-resize title textarea when content changes
  useEffect(() => {
    if (titleRef.current) {
      adjustTextareaHeight(titleRef.current);
    }
  }, [editedTitle]);

  // Initial resize on mount
  useEffect(() => {
    if (titleRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (titleRef.current) {
          adjustTextareaHeight(titleRef.current);
        }
      }, 0);
    }
  }, []);

  // Update only if content changed externally (not from our own saves)
  useEffect(() => {
    // Check if any values changed that we didn't save
    if (note.title !== lastSavedRef.current.title) {
      setEditedTitle(note.title);
      lastSavedRef.current.title = note.title;
    }

    if (note.abstractive_summary !== lastSavedRef.current.abstract) {
      setEditedAbstract(note.abstractive_summary);
      lastSavedRef.current.abstract = note.abstractive_summary;
    }

    const formattedExtractive = formatExtractiveContent(
      note.extractive_summary,
      note.is_edited
    );
    if (formattedExtractive !== lastSavedRef.current.extractive) {
      setEditedExtractive(formattedExtractive);
      lastSavedRef.current.extractive = formattedExtractive;
    }
  }, [
    note.title,
    note.abstractive_summary,
    note.extractive_summary,
    note.is_edited,
  ]);

  const saveChanges = async (
    title: string,
    abstract: string,
    extractive?: string
  ) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Update our reference to what we're saving
    lastSavedRef.current = {
      title,
      abstract,
      extractive:
        extractive !== undefined ? extractive : lastSavedRef.current.extractive,
    };

    const updatedNote = {
      ...note,
      title,
      abstractive_summary: abstract,
      ...(extractive !== undefined && {
        extractive_summary: [extractive],
      }),
      updated_at: new Date(),
      is_edited: true,
    };
    await storage.saveNote(updatedNote);
    onNoteUpdate(updatedNote);
  };

  const handleTitleBlur = () => {
    if (editedTitle !== note.title) {
      saveChanges(editedTitle, editedAbstract, editedExtractive);
    }
  };

  const handleAbstractBlur = () => {
    if (editedAbstract !== lastSavedRef.current.abstract) {
      saveChanges(editedTitle, editedAbstract, editedExtractive);
    }
  };

  const handleExtractiveBlur = () => {
    if (editedExtractive !== lastSavedRef.current.extractive) {
      saveChanges(editedTitle, editedAbstract, editedExtractive);
    }
  };

  const preserveCursorPosition = (
    element: HTMLElement,
    callback: () => void
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      callback();
      return;
    }

    const range = selection.getRangeAt(0);
    const offset = range.startOffset;
    const startContainer = range.startContainer;

    callback();

    setTimeout(() => {
      try {
        const newRange = document.createRange();
        if (startContainer.parentNode?.contains(startContainer)) {
          newRange.setStart(
            startContainer,
            Math.min(offset, startContainer.textContent?.length || 0)
          );
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } catch (e) {
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }, 0);
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
              ref={titleRef}
              value={editedTitle}
              onChange={(e) => {
                setEditedTitle(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              onBlur={handleTitleBlur}
              rows={1}
              className="w-full text-4xl font-bold bg-transparent text-white outline-none border-none resize-none placeholder-gray-500 leading-tight break-words max-w-full"
              placeholder="Untitled"
              style={{
                overflow: 'hidden',
                height: 'auto',
              }}
            />

            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
              <div className="flex items-center gap-2 pl-1">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">
                  {note.created_at &&
                    (() => {
                      const date = note.created_at;
                      const day = date.getDate();
                      const daySuffix =
                        day === 1 || day === 21 || day === 31
                          ? 'st'
                          : day === 2 || day === 22
                            ? 'nd'
                            : day === 3 || day === 23
                              ? 'rd'
                              : 'th';
                      const month = date.toLocaleString('en-GB', {
                        month: 'long',
                      });
                      const year = `'${date.getFullYear().toString().slice(-2)}`;
                      return `${day}${daySuffix} ${month} ${year}`;
                    })()}
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
            {editedAbstract ? (
              <div
                ref={abstractRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const element = e.currentTarget;
                  preserveCursorPosition(element, () => {
                    setEditedAbstract(element.textContent || '');
                  });
                }}
                onBlur={handleAbstractBlur}
                className="w-full bg-transparent text-gray-200 leading-relaxed text-lg outline-none border-none focus:bg-gray-900/20 rounded-lg px-2 transition-all text-justify"
                style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
              >
                {editedAbstract}
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditedAbstract(' ');
                  setTimeout(() => abstractRef.current?.focus(), 0);
                }}
                className="w-full bg-transparent text-gray-400 italic leading-relaxed text-lg outline-none border-none hover:bg-gray-900/20 rounded-lg px-2 transition-all text-justify cursor-text"
              >
                Executive summary will appear here...
              </div>
            )}
          </div>

          <div className="border-t border-gray-600 my-10"></div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              More Details&nbsp;&nbsp;🔖
            </h2>
            {editedExtractive ? (
              <div
                ref={extractiveRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const element = e.currentTarget;
                  preserveCursorPosition(element, () => {
                    setEditedExtractive(element.innerText || '');
                  });
                }}
                onBlur={handleExtractiveBlur}
                className="w-full bg-transparent leading-relaxed text-base text-justify outline-none border-none focus:bg-gray-900/20 rounded-lg px-2 py-1 transition-all text-gray-200"
                style={{
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  minHeight: '2em',
                }}
              >
                {editedExtractive}
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditedExtractive(' ');
                  setTimeout(() => extractiveRef.current?.focus(), 0);
                }}
                className="w-full bg-transparent text-gray-400 italic leading-relaxed text-base text-justify outline-none border-none hover:bg-gray-900/20 rounded-lg px-2 py-1 transition-all cursor-text"
                style={{
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  minHeight: '2em',
                }}
              >
                No detailed content available. Click to add content...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
