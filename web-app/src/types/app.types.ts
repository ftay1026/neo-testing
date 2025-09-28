export type VisibilityType = 'private' | 'public'; // TODO: Add public visibility type, and possibility to change visibility type

export type ModeType = 'assistant' | 'coach';

export interface Project {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: number;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteractionLog {
  id: number;
  project_id: string;
  title: string;
  content: string;
  log_period_start: string;
  log_period_end: string;
  created_at: string;
  updated_at: string;
  chat_id: string;
  chat_title?: string;
}

export interface Memory {
  id: number;
  title: string;
  content: string;
  category?: string;
  created_at: string;
  updated_at: string;
  chat_id: string;
  chats?: {
    title: string;
  };
}

export interface CreateMemoryData {
  title: string;
  content: string;
  category?: string;
  chat_id: string;
}

export interface UpdateMemoryData {
  id: number;
  title: string;
  content: string;
  category?: string;
}

export interface ExtractedMemory {
  shouldRemember: boolean;
  title?: string;
  content?: string;
  category?: string;
  message?: string;
}