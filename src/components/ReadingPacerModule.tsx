import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpenCheck, BookPlus, CalendarClock, Check, Plus, Trash2, X } from 'lucide-react';
import type { Book, ReadingSession } from '../types/reading';

interface ReadingPacerModuleProps {
  books: Book[];
  activeBook: Book;
  sessions: ReadingSession[];
  timerElapsedMinutes: number;
  prefilledMinutes: number | null;
  onClearPrefilledMinutes: () => void;
  onSelectBook: (bookId: string) => void;
  onAddBook: (title: string, author: string, totalPages: number, currentPage: number) => void;
  onDeleteBook: (bookId: string) => void;
  onLogSession: (startPage: number, endPage: number, durationMinutes: number) => void;
  compact?: boolean;
}

export function ReadingPacerModule({
  books,
  activeBook,
  sessions,
  timerElapsedMinutes,
  prefilledMinutes,
  onClearPrefilledMinutes,
  onSelectBook,
  onAddBook,
  onDeleteBook,
  onLogSession,
  compact = false,
}: ReadingPacerModuleProps) {
  const [showAddBook, setShowAddBook] = useState(false);
  const [showQuickPageUpdate, setShowQuickPageUpdate] = useState(false);
  const [quickPageValue, setQuickPageValue] = useState(String(activeBook.currentPage));
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTotalPages, setNewTotalPages] = useState('250');
  const [newCurrentPage, setNewCurrentPage] = useState('0');

  const [startPage, setStartPage] = useState(String(activeBook.currentPage));
  const [endPage, setEndPage] = useState(
    String(Math.min(activeBook.totalPages, activeBook.currentPage + 15)),
  );
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [sessionSavedFlash, setSessionSavedFlash] = useState(false);

  useEffect(() => {
    setStartPage(String(activeBook.currentPage));
    setEndPage(String(Math.min(activeBook.totalPages, activeBook.currentPage + 15)));
    setQuickPageValue(String(activeBook.currentPage));
  }, [activeBook.id, activeBook.currentPage, activeBook.totalPages]);

  useEffect(() => {
    if (prefilledMinutes !== null && prefilledMinutes > 0) {
      setDurationMinutes(String(prefilledMinutes));
    }
  }, [prefilledMinutes]);

  const stats = useMemo(() => {
    const totalPagesRead = sessions.reduce((acc, s) => acc + Math.max(0, s.pagesRead), 0);
    const totalMinutes = sessions.reduce((acc, s) => acc + Math.max(0, s.durationMinutes), 0);

    const speedPagesPerHour =
      totalMinutes > 0 && totalPagesRead > 0
        ? Math.round((totalPagesRead / totalMinutes) * 60)
        : 0;

    const remainingPages = Math.max(0, activeBook.totalPages - activeBook.currentPage);
    const progressPercent =
      activeBook.totalPages > 0
        ? Math.min(100, Math.round((activeBook.currentPage / activeBook.totalPages) * 100))
        : 0;

    let forecastDateText: string | null = null;
    if (remainingPages > 0 && speedPagesPerHour > 0) {
      const avgDailyMinutes =
        sessions.length > 0
          ? Math.max(30, Math.min(90, Math.round(totalMinutes / sessions.length)))
          : 45;
      const hoursNeeded = remainingPages / speedPagesPerHour;
      const daysNeeded = Math.max(1, Math.ceil((hoursNeeded * 60) / avgDailyMinutes));
      const targetDate = new Date(Date.now() + daysNeeded * 86400000);
      forecastDateText = targetDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }

    return {
      speedPagesPerHour,
      remainingPages,
      progressPercent,
      forecastDateText,
      totalMinutes,
    };
  }, [sessions, activeBook]);

  const handleAddBookSubmit = (e: FormEvent) => {
    e.preventDefault();
    const total = Math.max(1, Number(newTotalPages) || 200);
    const current = Math.max(0, Math.min(total, Number(newCurrentPage) || 0));
    if (!newTitle.trim()) return;

    onAddBook(newTitle.trim(), newAuthor.trim(), total, current);
    setNewTitle('');
    setNewAuthor('');
    setNewTotalPages('250');
    setNewCurrentPage('0');
    setShowAddBook(false);
  };

  const handleLogSessionSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sPage = Math.max(0, Number(startPage) || 0);
    const ePage = Math.min(activeBook.totalPages, Math.max(sPage, Number(endPage) || sPage));
    const mins = Math.max(1, Number(durationMinutes) || 15);

    onLogSession(sPage, ePage, mins);
    onClearPrefilledMinutes();
    setSessionSavedFlash(true);
    setTimeout(() => setSessionSavedFlash(false), 2000);
  };

  const handleQuickPageSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedPage = Number(quickPageValue);
    if (!Number.isFinite(parsedPage)) return;

    const targetPage = Math.max(0, Math.min(activeBook.totalPages, Math.floor(parsedPage)));
    const sPage = Math.min(activeBook.currentPage, targetPage);
    const autoMinutes = timerElapsedMinutes > 0 ? timerElapsedMinutes : 15;

    onLogSession(sPage, targetPage, autoMinutes);
    onClearPrefilledMinutes();
    setShowQuickPageUpdate(false);
    setSessionSavedFlash(true);
    setTimeout(() => setSessionSavedFlash(false), 2000);
  };

  return (
    <section
      aria-label="Đo Nhịp Độ và Dự Báo Hoàn Thành"
      className={`rounded-xl border border-[#262A34] bg-[#181B20] ${
        compact ? 'p-3' : 'p-5'
      } flex flex-col ${compact ? 'gap-2.5' : 'gap-3.5'}`}
    >
      {/* Header + Book Switcher */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="whitespace-nowrap text-sm font-semibold text-[#E2E8F0] tracking-wide">
          Nhịp Độ & Dự Báo
        </h2>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => {
              setShowQuickPageUpdate((v) => !v);
              setShowAddBook(false);
              setQuickPageValue(String(activeBook.currentPage));
            }}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              showQuickPageUpdate
                ? 'border-[#38BDF8]/60 bg-[#38BDF8]/15 text-[#38BDF8]'
                : 'border-[#262A34] bg-[#0F1115] text-[#CBD5E1] hover:border-[#363C4A] hover:text-[#E2E8F0]'
            }`}
          >
            <BookOpenCheck className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span>Cập nhật trang</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddBook((v) => !v);
              setShowQuickPageUpdate(false);
            }}
            className="flex items-center gap-1 rounded-md border border-[#262A34] bg-[#0F1115] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] hover:border-[#363C4A] hover:text-[#E2E8F0] transition-colors cursor-pointer whitespace-nowrap"
          >
            {showAddBook ? (
              <>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đóng</span>
              </>
            ) : (
              <>
                <BookPlus className="h-3.5 w-3.5 text-[#D97706]" aria-hidden="true" />
                <span>Thêm sách</span>
              </>
            )}
          </button>

          {books.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteBook(activeBook.id)}
              title="Xóa cuốn sách đang chọn"
              aria-label="Xóa cuốn sách đang chọn"
              className="rounded-md border border-[#262A34] bg-[#0F1115] p-1.5 text-[#64748B] hover:text-[#F87171] transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Page Update Inline Form */}
      {showQuickPageUpdate && (
        <form
          onSubmit={handleQuickPageSubmit}
          className="rounded-lg border border-[#38BDF8]/30 bg-[#0F1115] p-3 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="quick-page-input" className="text-xs text-[#CBD5E1] whitespace-nowrap">
              Trang vừa đọc xong:
            </label>
            <input
              id="quick-page-input"
              type="number"
              min={0}
              max={activeBook.totalPages}
              autoFocus
              value={quickPageValue}
              onChange={(e) => setQuickPageValue(e.target.value)}
              className="w-20 rounded-md border border-[#262A34] bg-[#181B20] px-2 py-1 text-center font-mono text-xs text-[#E2E8F0] tabular-nums focus:border-[#38BDF8] focus:outline-none"
            />
            <button
              type="submit"
              className="ml-auto rounded-md bg-[#38BDF8] px-3 py-1 text-xs font-semibold text-[#0F1115] hover:bg-[#7DD3FC] transition-colors cursor-pointer whitespace-nowrap"
            >
              Lưu
            </button>
          </div>
          <p className="text-[11px] text-[#94A3B8]">
            Tự động lưu phiên đọc:{' '}
            <span className="font-mono text-[#E2E8F0] tabular-nums">
              {timerElapsedMinutes > 0
                ? `${timerElapsedMinutes} phút theo đồng hồ`
                : '15 phút mặc định (đồng hồ chưa chạy)'}
            </span>
          </p>
        </form>
      )}

      {/* Add Book Inline Form */}
      {showAddBook ? (
        <form
          onSubmit={handleAddBookSubmit}
          className="rounded-lg border border-[#262A34] bg-[#0F1115] p-3 flex flex-col gap-2"
        >
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tên sách..."
            className="w-full rounded-md border border-[#262A34] bg-[#181B20] px-2.5 py-1.5 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:border-[#D97706] focus:outline-none"
          />
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Tác giả (không bắt buộc)"
            className="w-full rounded-md border border-[#262A34] bg-[#181B20] px-2.5 py-1.5 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:border-[#D97706] focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#94A3B8] mb-1">Tổng số trang</label>
              <input
                type="number"
                min={1}
                value={newTotalPages}
                onChange={(e) => setNewTotalPages(e.target.value)}
                className="w-full rounded-md border border-[#262A34] bg-[#181B20] px-2.5 py-1.5 font-mono text-xs text-[#E2E8F0] tabular-nums focus:border-[#D97706] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#94A3B8] mb-1">Đang ở trang</label>
              <input
                type="number"
                min={0}
                value={newCurrentPage}
                onChange={(e) => setNewCurrentPage(e.target.value)}
                className="w-full rounded-md border border-[#262A34] bg-[#181B20] px-2.5 py-1.5 font-mono text-xs text-[#E2E8F0] tabular-nums focus:border-[#D97706] focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-1 rounded-md bg-[#D97706] py-1.5 text-xs font-semibold text-[#0F1115] hover:bg-[#F59E0B] transition-colors cursor-pointer"
          >
            Lưu sách vào kệ
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <select
            aria-label="Chọn sách đang đọc"
            value={activeBook.id}
            onChange={(e) => onSelectBook(e.target.value)}
            className="w-full rounded-lg border border-[#262A34] bg-[#0F1115] px-3 py-2 text-xs font-medium text-[#E2E8F0] focus:border-[#D97706] focus:outline-none cursor-pointer"
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.currentPage}/{b.totalPages} trang)
              </option>
            ))}
          </select>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>
                Trang{' '}
                <strong className="font-mono text-[#E2E8F0] tabular-nums">
                  {activeBook.currentPage}
                </strong>{' '}
                / {activeBook.totalPages}
              </span>
              <span className="font-mono text-[#FBBF24] tabular-nums">
                {stats.progressPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F1115]">
              <div
                className="h-full rounded-full bg-[#D97706] transition-transform duration-300"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Forecast Banner */}
      <div className="rounded-lg border border-[#262A34] bg-[#0F1115] p-3 flex items-start gap-2.5">
        <CalendarClock className="h-4 w-4 shrink-0 text-[#38BDF8] mt-0.5" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-[#CBD5E1]">
          {stats.remainingPages === 0 ? (
            <span className="text-[#FBBF24] font-medium">
              Chúc mừng! Bạn đã đọc trọn vẹn cuốn sách này.
            </span>
          ) : stats.speedPagesPerHour > 0 && stats.forecastDateText ? (
            <>
              Với nhịp độ hiện tại (
              <strong className="font-mono text-[#E2E8F0] tabular-nums">
                ~{stats.speedPagesPerHour} trang/giờ
              </strong>
              ), bạn sẽ hoàn thành cuốn sách này vào khoảng{' '}
              <strong className="font-mono text-[#38BDF8] tabular-nums">
                {stats.forecastDateText}
              </strong>
              .
            </>
          ) : (
            <span className="text-[#94A3B8]">
              Ghi nhận phiên đọc đầu tiên bên dưới để tính tốc độ (trang/giờ) và ngày hoàn thành dự kiến.
            </span>
          )}
        </p>
      </div>

      {/* Log Reading Session Form */}
      <form onSubmit={handleLogSessionSubmit} className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="pacer-start" className="block text-[11px] text-[#94A3B8] mb-1">
              Từ trang
            </label>
            <input
              id="pacer-start"
              type="number"
              min={0}
              max={activeBook.totalPages}
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              className="w-full rounded-md border border-[#262A34] bg-[#0F1115] px-2 py-1.5 font-mono text-xs text-[#E2E8F0] tabular-nums focus:border-[#D97706] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pacer-end" className="block text-[11px] text-[#94A3B8] mb-1">
              Đến trang
            </label>
            <input
              id="pacer-end"
              type="number"
              min={0}
              max={activeBook.totalPages}
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              className="w-full rounded-md border border-[#262A34] bg-[#0F1115] px-2 py-1.5 font-mono text-xs text-[#E2E8F0] tabular-nums focus:border-[#D97706] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pacer-mins" className="block text-[11px] text-[#94A3B8] mb-1">
              Thời gian (phút)
            </label>
            <input
              id="pacer-mins"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full rounded-md border border-[#262A34] bg-[#0F1115] px-2 py-1.5 font-mono text-xs text-[#E2E8F0] tabular-nums focus:border-[#D97706] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#262A34] bg-[#262A34]/70 py-1.5 text-xs font-medium text-[#E2E8F0] hover:bg-[#323846] transition-colors cursor-pointer"
        >
          {sessionSavedFlash ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>Đã cập nhật nhịp độ</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 text-[#D97706]" aria-hidden="true" />
              <span>Cập nhật phiên đọc</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
