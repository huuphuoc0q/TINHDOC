import type { Book, NoteCategory, PinItem, ReadingNote, ReadingSession, WorkspaceState } from '../types/reading';

const STORAGE_KEY = 'tinh_doc_workspace_v1';

const DEFAULT_BOOK_ID = 'book-starter-1';

export const DEFAULT_WORKSPACE: WorkspaceState = {
  books: [
    {
      id: DEFAULT_BOOK_ID,
      title: 'Những Giấc Mơ Ở Hiệu Sách Morisaki',
      author: 'Yagisawa Satoshi',
      totalPages: 212,
      currentPage: 48,
      createdAt: '2026-11-20T09:00:00.000Z',
    },
  ],
  activeBookId: DEFAULT_BOOK_ID,
  notes: [
    {
      id: 'note-starter-1',
      bookId: DEFAULT_BOOK_ID,
      page: 24,
      category: 'quote',
      content: 'Dù thế giới bên ngoài có ồn ào đến đâu, giữa những trang sách luôn có một góc trú ẩn dịu dàng.',
      createdAt: '2026-11-20T14:20:00.000Z',
    },
    {
      id: 'note-starter-2',
      bookId: DEFAULT_BOOK_ID,
      page: 41,
      category: 'idea',
      content: 'Dành 30 phút cuối buổi tối tắt điện thoại để đọc liên mạch trước khi ngủ.',
      createdAt: '2026-11-20T21:10:00.000Z',
    },
  ],
  pins: [
    {
      id: 'pin-starter-1',
      bookId: DEFAULT_BOOK_ID,
      term: 'Takako',
      description: 'Nhân vật chính, chuyển về sống trên gác xép hiệu sách cũ của cậu Satoru tại Jinbocho.',
      createdAt: '2026-11-20T14:15:00.000Z',
    },
    {
      id: 'pin-starter-2',
      bookId: DEFAULT_BOOK_ID,
      term: 'Khu phố sách Jinbocho',
      description: 'Khu phố sách cổ nổi tiếng ở Tokyo với hơn trăm tiệm sách cũ san sát.',
      createdAt: '2026-11-20T14:18:00.000Z',
    },
  ],
  sessions: [
    {
      id: 'session-starter-1',
      bookId: DEFAULT_BOOK_ID,
      startPage: 1,
      endPage: 48,
      pagesRead: 47,
      durationMinutes: 75,
      createdAt: '2026-11-20T20:00:00.000Z',
    },
  ],
  audio: {
    volumes: {
      rain: 35,
      fireplace: 0,
      brownNoise: 0,
      ambient: 20,
    },
    isMuted: false,
    isPlaying: false,
  },
  mode: 'paper',
  warmPaper: false,
};

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;

    const books = Array.isArray(parsed.books) && parsed.books.length > 0 ? parsed.books : DEFAULT_WORKSPACE.books;
    const activeBookId =
      parsed.activeBookId && books.some((b) => b.id === parsed.activeBookId)
        ? parsed.activeBookId
        : books[0].id;

    return {
      books,
      activeBookId,
      notes: Array.isArray(parsed.notes) ? parsed.notes : DEFAULT_WORKSPACE.notes,
      pins: Array.isArray(parsed.pins) ? parsed.pins : DEFAULT_WORKSPACE.pins,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : DEFAULT_WORKSPACE.sessions,
      audio: parsed.audio
        ? {
            volumes: {
              rain: parsed.audio.volumes?.rain ?? 35,
              fireplace: parsed.audio.volumes?.fireplace ?? 0,
              brownNoise: parsed.audio.volumes?.brownNoise ?? 0,
              ambient: parsed.audio.volumes?.ambient ?? 20,
            },
            isMuted: Boolean(parsed.audio.isMuted),
            isPlaying: false, // Never auto-play audio unprompted on reload
          }
        : DEFAULT_WORKSPACE.audio,
      mode: parsed.mode === 'pdf' ? 'pdf' : 'paper',
      warmPaper: Boolean(parsed.warmPaper),
    };
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  quote: 'Trích dẫn',
  idea: 'Ý tưởng / Áp dụng',
  question: 'Câu hỏi',
  note: 'Ghi chú',
};

export function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugifyFilename(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'tinh-doc'
  );
}

export function exportBookNotesMarkdown(
  book: Book,
  notes: ReadingNote[],
  pins: PinItem[],
): void {
  const lines: string[] = [];
  lines.push(`# ${book.title}`);
  if (book.author) {
    lines.push(`**Tác giả:** ${book.author}`);
  }
  lines.push(`**Tiến độ:** Trang ${book.currentPage} / ${book.totalPages}`);
  lines.push(`**Xuất từ Tĩnh Đọc:** ${new Date().toLocaleDateString('vi-VN')}`);
  lines.push('');

  if (notes.length > 0) {
    lines.push('## Ghi chú & Trích dẫn');
    lines.push('');
    const sorted = [...notes].sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
    for (const note of sorted) {
      const pagePrefix = note.page !== null ? `Trang ${note.page} · ` : '';
      const header = `### ${pagePrefix}${CATEGORY_LABELS[note.category]}`;
      lines.push(header);
      if (note.category === 'quote') {
        lines.push(`> "${note.content}"`);
      } else {
        lines.push(note.content);
      }
      lines.push('');
    }
  } else {
    lines.push('_Chưa có ghi chú nào cho cuốn sách này._');
    lines.push('');
  }

  if (pins.length > 0) {
    lines.push('## Bảng Ghim Nhân Vật & Khái Niệm');
    lines.push('');
    for (const pin of pins) {
      lines.push(`- **${pin.term}**: ${pin.description}`);
    }
    lines.push('');
  }

  const filename = `${slugifyFilename(book.title)}-ghi-chu.md`;
  triggerDownload(filename, lines.join('\n'), 'text/markdown;charset=utf-8');
}

export function exportBookBackupJson(
  book: Book,
  notes: ReadingNote[],
  pins: PinItem[],
  sessions: ReadingSession[],
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Tĩnh Đọc',
    book,
    notes,
    pins,
    sessions,
  };
  const filename = `${slugifyFilename(book.title)}-sao-luu.json`;
  triggerDownload(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
}
