import { useEffect, useMemo, useState, type FormEvent, type RefObject } from 'react';
import { Download, FileJson, Search, Trash2 } from 'lucide-react';
import type { Book, NoteCategory, ReadingNote } from '../types/reading';

interface QuickNotesModuleProps {
  activeBook: Book;
  notes: ReadingNote[];
  noteInputRef: RefObject<HTMLInputElement | null>;
  onAddNote: (page: number | null, category: NoteCategory, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  compact?: boolean;
}

type FilterOption = 'all' | NoteCategory;

const FILTER_TABS: Array<{ id: FilterOption; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'quote', label: 'Trích dẫn' },
  { id: 'idea', label: 'Ý tưởng' },
  { id: 'question', label: 'Câu hỏi' },
  { id: 'note', label: 'Ghi chú' },
];

const CATEGORY_META: Record<NoteCategory, { label: string; accentClass: string }> = {
  quote: { label: 'Trích dẫn', accentClass: 'text-[#FBBF24]' },
  idea: { label: 'Ý tưởng / Áp dụng', accentClass: 'text-[#38BDF8]' },
  question: { label: 'Câu hỏi', accentClass: 'text-[#C084FC]' },
  note: { label: 'Ghi chú', accentClass: 'text-[#94A3B8]' },
};

function detectPrefixCategory(rawText: string): {
  category: NoteCategory;
  cleanContent: string;
} {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('"') || trimmed.startsWith('“')) {
    const stripped = trimmed
      .replace(/^[“"]/, '')
      .replace(/[”"]$/, '')
      .trim();
    return { category: 'quote', cleanContent: stripped || trimmed };
  }
  if (trimmed.startsWith('!')) {
    const stripped = trimmed.slice(1).trim();
    return { category: 'idea', cleanContent: stripped || trimmed };
  }
  if (trimmed.startsWith('?')) {
    const stripped = trimmed.slice(1).trim();
    return { category: 'question', cleanContent: stripped || trimmed };
  }
  return { category: 'note', cleanContent: trimmed };
}

export function QuickNotesModule({
  activeBook,
  notes,
  noteInputRef,
  onAddNote,
  onDeleteNote,
  onExportMarkdown,
  onExportJson,
  compact = false,
}: QuickNotesModuleProps) {
  const [pageInput, setPageInput] = useState<string>(
    activeBook.currentPage > 0 ? String(activeBook.currentPage) : '',
  );
  const [textInput, setTextInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setPageInput(activeBook.currentPage > 0 ? String(activeBook.currentPage) : '');
    setTextInput('');
    setActiveFilter('all');
    setSearchQuery('');
  }, [activeBook.id, activeBook.currentPage]);

  const liveDetection = useMemo(() => detectPrefixCategory(textInput), [textInput]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes
      .filter((n) => (activeFilter === 'all' ? true : n.category === activeFilter))
      .filter((n) => {
        if (!q) return true;
        const pageMatch = n.page !== null && String(n.page).includes(q);
        return n.content.toLowerCase().includes(q) || pageMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, activeFilter, searchQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const { category, cleanContent } = detectPrefixCategory(textInput);
    const parsedPage = pageInput.trim() ? Number(pageInput.trim()) : null;
    const validPage =
      parsedPage !== null && Number.isFinite(parsedPage) && parsedPage >= 0
        ? Math.floor(parsedPage)
        : null;

    onAddNote(validPage, category, cleanContent);
    setTextInput('');
  };

  return (
    <section
      aria-label="Sổ Nháp Ghi Chú Siêu Tốc"
      className={`rounded-xl border border-[#262A34] bg-[#181B20] ${
        compact ? 'p-4' : 'p-5'
      } flex flex-col gap-4 h-full min-h-0`}
    >
      {/* Header + Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {!compact && (
            <h2 className="text-sm font-semibold text-[#E2E8F0] tracking-wide">
              Sổ Nháp Ghi Chú Siêu Tốc
            </h2>
          )}
          <p className={`text-xs text-[#94A3B8] truncate max-w-[240px] ${compact ? '' : 'mt-0.5'}`}>
            {activeBook.title} · {notes.length} ghi chú
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onExportMarkdown}
            title="Xuất ghi chú ra tệp Markdown (.md)"
            className="flex items-center gap-1.5 rounded-md border border-[#262A34] bg-[#0F1115] px-2.5 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#363C4A] hover:text-[#E2E8F0] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-[#D97706]" aria-hidden="true" />
            <span>Xuất .md</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            title="Sao lưu toàn bộ dữ liệu cuốn sách (.json)"
            className="flex items-center gap-1.5 rounded-md border border-[#262A34] bg-[#0F1115] px-2.5 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#363C4A] hover:text-[#E2E8F0] transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileJson className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span>Sao lưu JSON</span>
          </button>
        </div>
      </div>

      {/* Keyboard-First Input Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative w-[56px] shrink-0">
            <label htmlFor="note-page-input" className="sr-only">
              Số trang
            </label>
            <input
              id="note-page-input"
              type="number"
              min={0}
              max={9999}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder="Trang"
              className="w-full rounded-lg border border-[#262A34] bg-[#0F1115] px-1.5 py-2 text-center font-mono text-xs text-[#E2E8F0] placeholder-[#64748B] tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-[#D97706] focus:outline-none"
            />
          </div>

          <div className="relative flex-1">
            <label htmlFor="quick-note-input" className="sr-only">
              Nội dung ghi chú nhanh
            </label>
            <input
              ref={noteInputRef}
              id="quick-note-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder='Gõ nhanh ghi chú rồi nhấn Enter... (Alt + N)'
              className="w-full rounded-lg border border-[#262A34] bg-[#0F1115] px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#64748B] focus:border-[#D97706] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#D97706] px-3.5 py-2 text-xs font-semibold text-[#0F1115] hover:bg-[#F59E0B] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
          >
            Lưu
          </button>
        </div>

        {/* Syntax Hint & Live Category Detection */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
          <span>
            Tiền tố: <code className="font-mono text-[#FBBF24]">"</code> Trích dẫn ·{' '}
            <code className="font-mono text-[#38BDF8]">!</code> Ý tưởng ·{' '}
            <code className="font-mono text-[#C084FC]">?</code> Câu hỏi
          </span>

          {textInput.trim().length > 0 && (
            <span className={`font-medium ${CATEGORY_META[liveDetection.category].accentClass}`}>
              Phân loại: {CATEGORY_META[liveDetection.category].label}
            </span>
          )}
        </div>
      </form>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-2 border-t border-[#262A34] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-[#0F1115] p-1 border border-[#262A34] overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-[#262A34] text-[#E2E8F0]'
                    : 'text-[#94A3B8] hover:text-[#E2E8F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trong ghi chú..."
              className="w-full rounded-lg border border-[#262A34] bg-[#0F1115] pl-8 pr-2.5 py-1.5 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:border-[#38BDF8] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notes Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[200px]">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#262A34] bg-[#0F1115]/50 px-4 py-10 text-center">
            <svg
              className="h-10 w-10 text-[#363C4A] mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h8M8 11h6" />
            </svg>
            <p className="text-sm font-medium text-[#CBD5E1]">
              {notes.length === 0
                ? 'Trang giấy nháp đang chờ những dòng suy ngẫm đầu tiên'
                : 'Không tìm thấy ghi chú nào khớp bộ lọc'}
            </p>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs">
              {notes.length === 0
                ? 'Nhấn Alt + N bất kỳ lúc nào để ghi nhanh trích dẫn hoặc ý tưởng mà không rời mắt khỏi sách.'
                : 'Thử xóa từ khóa tìm kiếm hoặc chọn tab Tất cả.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const meta = CATEGORY_META[note.category];
            const dateStr = new Date(note.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <article
                key={note.id}
                className="group rounded-lg border border-[#262A34] bg-[#0F1115] p-3.5 transition-colors hover:border-[#363C4A]"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-medium ${meta.accentClass}`}>{meta.label}</span>
                    {note.page !== null && (
                      <>
                        <span className="text-[#475569]" aria-hidden="true">·</span>
                        <span className="font-mono text-[#94A3B8] tabular-nums">
                          Trang {note.page}
                        </span>
                      </>
                    )}
                    <span className="text-[#475569]" aria-hidden="true">·</span>
                    <span className="font-mono text-[#64748B] tabular-nums">{dateStr}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    aria-label="Xóa ghi chú"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-1 text-[#64748B] hover:text-[#F87171] transition-opacity cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                {note.category === 'quote' ? (
                  <blockquote className="font-serif italic text-[15px] leading-relaxed text-[#F1F5F9]">
                    “{note.content}”
                  </blockquote>
                ) : (
                  <p className="text-sm leading-relaxed text-[#E2E8F0]">{note.content}</p>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
