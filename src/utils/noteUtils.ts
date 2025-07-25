import { Note, Entity, PipelineResult } from '../types';

export const createNoteFromPipeline = (result: PipelineResult): Note => {
  const entities: Entity[] = [];

  // Extract entities from the result
  if (result.data.entities) {
    Object.entries(result.data.entities).forEach(([category, entityList]) => {
      if (Array.isArray(entityList)) {
        entityList.forEach((entity) => {
          entities.push({
            text: entity.text || entity,
            label: entity.label || category,
            start: entity.start || 0,
            end: entity.end || 0,
            confidence: entity.confidence,
          });
        });
      }
    });
  }

  const now = new Date();
  const title =
    result.data.file_info.filename.replace(/\.[^/.]+$/, '') || 'Untitled Note';

  return {
    id: crypto.randomUUID(),
    title,
    content: result.data.content || '',
    abstractive_summary: result.data.abstractive_summary?.summary || '',
    extractive_summary: result.data.extractive_summary?.summary || [],
    entities,
    created_at: now,
    updated_at: now,
    is_edited: false,
    file_info: result.data.file_info,
  };
};

export const getEntityColor = (label: string): string => {
  const colors: Record<string, string> = {
    PERSON: 'text-blue-300',
    ORG: 'text-green-300',
    ORGANIZATION: 'text-green-300',
    GPE: 'text-purple-300',
    LOCATION: 'text-purple-300',
    DATE: 'text-orange-300',
    TIME: 'text-orange-300',
    MONEY: 'text-yellow-300',
    PERCENT: 'text-pink-300',
    MISC: 'text-gray-300',
  };

  return colors[label.toUpperCase()] || colors['MISC'];
};
