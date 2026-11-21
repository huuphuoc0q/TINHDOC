export type AppMode = 'paper' | 'pdf';

export type NoteCategory = 'quote' | 'idea' | 'question' | 'note';

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  createdAt: string;
}

export interface ReadingNote {
  id: string;
  bookId: string;
  page: number | null;
  category: NoteCategory;
  content: string;
  createdAt: string;
}

export interface PinItem {
  id: string;
  bookId: string;
  term: string;
  description: string;
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  durationMinutes: number;
  createdAt: string;
}

export type AmbientTrackId = 'rain' | 'fireplace' | 'brownNoise' | 'ambient';

export interface AudioSettings {
  volumes: Record<AmbientTrackId, number>; // 0 to 100
  isMuted: boolean;
  isPlaying: boolean;
}

export type TimerMode = 'stopwatch' | 'pomodoro';

export type PomodoroDurationMinutes = 25 | 45 | 60;

export interface WorkspaceState {
  books: Book[];
  activeBookId: string;
  notes: ReadingNote[];
  pins: PinItem[];
  sessions: ReadingSession[];
  audio: AudioSettings;
  mode: AppMode;
  warmPaper: boolean;
}
