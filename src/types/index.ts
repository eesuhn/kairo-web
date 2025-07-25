export interface Note {
  id: string;
  title: string;
  content: string;
  abstractive_summary: string;
  extractive_summary: string[];
  entities: Entity[];
  created_at: Date;
  updated_at: Date;
  is_edited: boolean;
  file_info?: FileInfo;
}

export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface FileInfo {
  filename: string;
  size: number;
  content_type: string;
}

export interface PipelineResult {
  status: 'success' | 'error';
  status_code: number;
  message: string;
  data: {
    file_info: FileInfo;
    content: string;
    entities: Record<string, Entity[]>;
    abstractive_summary: {
      summary: string;
    };
    extractive_summary: {
      summary: string;
    };
  };
}

export interface SearchResult {
  type: 'note';
  id: string;
  title: string;
  snippet?: string;
}