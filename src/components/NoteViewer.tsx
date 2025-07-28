import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { Calendar } from 'lucide-react';
import { Note } from '../types';
import { EntityPill } from './EntityPill';
import { storage } from '../utils/storage';
import { getReadableEntityLabel } from '../utils/entityLabels';

interface NoteViewerProps {
  note: Note;
  onNoteUpdate: (note: Note) => void;
  onEntityTypeClick: (entityType: string) => void;
}

const formatExtractiveContent = (
  extractiveArray: string[],
  isEdited: boolean = false
): string => {
  if (!Array.isArray(extractiveArray) || extractiveArray.length === 0)
    return '';

  if (
    isEdited ||
    (extractiveArray.length === 1 &&
      !extractiveArray[0].match(/^[^.!?]+[.!?]$/))
  ) {
    return extractiveArray.join(' ');
  }

  const allText = extractiveArray.join(' ');
  const sentences = allText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  const paragraphs = [];

  for (let i = 0; i < sentences.length; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join(' ');
    if (paragraph.trim()) paragraphs.push(paragraph);
  }

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

  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    note.entities.forEach((entity) => {
      if (
        entity.label.toLowerCase() !== 'misc' &&
        entity.label.toLowerCase() !== 'miscellaneous'
      ) {
        types.add(entity.label);
      }
    });
    return Array.from(types);
  }, [note.entities]);

  const formattedDate = useMemo(() => {
    if (!note.created_at) return '';
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
    const month = date.toLocaleString('en-GB', { month: 'long' });
    const year = `'${date.getFullYear().toString().slice(-2)}`;
    return `${day}${daySuffix} ${month} ${year}`;
  }, [note.created_at]);

  const truncateFilename = useCallback(
    (filename: string, maxLength: number = 30) => {
      if (filename.length <= maxLength) return filename;
      const extension = filename.split('.').pop();
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      const truncatedName = nameWithoutExt.substring(
        0,
        maxLength - extension!.length - 4
      );
      return `${truncatedName}...${extension}`;
    },
    []
  );

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  const saveChanges = useCallback(
    async (title: string, abstract: string, extractive?: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      lastSavedRef.current = {
        title,
        abstract,
        extractive:
          extractive !== undefined
            ? extractive
            : lastSavedRef.current.extractive,
      };

      const updatedNote = {
        ...note,
        title,
        abstractive_summary: abstract,
        ...(extractive !== undefined && { extractive_summary: [extractive] }),
        updated_at: new Date(),
        is_edited: true,
      };

      await storage.saveNote(updatedNote);
      onNoteUpdate(updatedNote);
    },
    [note, onNoteUpdate]
  );

  const handleTitleBlur = useCallback(() => {
    if (editedTitle !== note.title) {
      saveChanges(editedTitle, editedAbstract, editedExtractive);
    }
  }, [editedTitle, note.title, editedAbstract, editedExtractive, saveChanges]);

  const handleAbstractBlur = useCallback(() => {
    if (editedAbstract !== lastSavedRef.current.abstract) {
      saveChanges(editedTitle, editedAbstract, editedExtractive);
    }
  }, [editedAbstract, editedTitle, editedExtractive, saveChanges]);

  const handleExtractiveBlur = useCallback(() => {
    if (editedExtractive !== lastSavedRef.current.extractive) {
      saveChanges(editedTitle, editedAbstract, editedExtractive);
    }
  }, [editedExtractive, editedTitle, editedAbstract, saveChanges]);

  const preserveCursorPosition = useCallback(
    (element: HTMLElement, callback: () => void) => {
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
    },
    []
  );

  // Initialize content
  useEffect(() => {
    const formattedExtractive = formatExtractiveContent(
      note.extractive_summary,
      note.is_edited
    );
    setEditedTitle(note.title);
    setEditedAbstract(note.abstractive_summary);
    setEditedExtractive(formattedExtractive);

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

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      adjustTextareaHeight(titleRef.current);
    }
  }, [editedTitle, adjustTextareaHeight]);

  // Initial resize on mount
  useEffect(() => {
    if (titleRef.current) {
      setTimeout(() => {
        if (titleRef.current) {
          adjustTextareaHeight(titleRef.current);
        }
      }, 0);
    }
  }, [adjustTextareaHeight]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8 pb-16">
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
              className="w-full max-w-full resize-none break-words border-none bg-transparent text-4xl font-bold leading-tight text-black placeholder-gray-500 outline-none"
              placeholder="Untitled"
              style={{ overflow: 'hidden', height: 'auto' }}
            />

            <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 pl-1">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">{formattedDate}</span>
              </div>
              {note.file_info && (
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-black">
                  {truncateFilename(note.file_info.filename)}
                </span>
              )}
            </div>
          </div>

          {entityTypes.length > 0 && (
            <div className="mb-10">
              <div className="flex flex-wrap gap-2">
                {entityTypes.map((entityType, index) => (
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
            <h2 className="mb-4 text-xl font-semibold text-black">
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
                className="w-full rounded-lg border-none bg-transparent px-2 text-justify text-lg leading-relaxed text-gray-700 outline-none transition-all"
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
                className="w-full cursor-text rounded-lg border-none bg-transparent px-2 text-justify text-lg leading-relaxed text-gray-400 outline-none transition-all"
              >
                Executive summary will appear here...
              </div>
            )}
          </div>

          <div className="my-10 border-t-2 border-gray-200"></div>

          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
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
                className="w-full rounded-lg border-none bg-transparent px-2 py-1 text-justify text-base leading-relaxed text-gray-700 outline-none transition-all"
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
                className="w-full cursor-text rounded-lg border-none bg-transparent px-2 py-1 text-justify text-base leading-relaxed text-black outline-none transition-all"
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
