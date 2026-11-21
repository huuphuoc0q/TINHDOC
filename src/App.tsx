import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Header } from './components/Header';
import { AmbientTimerModule } from './components/AmbientTimerModule';
import { QuickNotesModule } from './components/QuickNotesModule';
import { LookupPinboardModule } from './components/LookupPinboardModule';
import { ReadingPacerModule } from './components/ReadingPacerModule';
import { PdfViewerPane } from './components/PdfViewerPane';
import type {
  AmbientTrackId,
  AppMode,
  Book,
  NoteCategory,
  PinItem,
  PomodoroDurationMinutes,
  ReadingNote,
  ReadingSession,
  TimerMode,
  WorkspaceState,
} from './types/reading';
import { audioEngine } from './utils/audioEngine';
import {
  exportBookBackupJson,
  exportBookNotesMarkdown,
  generateId,
  loadWorkspace,
  saveWorkspace,
} from './utils/storage';

type SidebarPanelId = 'notes' | 'ambient' | 'lookup' | 'pacer';

interface AccordionCardProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function AccordionCard({ title, subtitle, isOpen, onToggle, children }: AccordionCardProps) {
  return (
    <div className="rounded-xl border border-[#262A34] bg-[#181B20] overflow-hidden shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[#1E222A] transition-colors cursor-pointer"
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#E2E8F0] tracking-wide truncate">
            {title}
          </div>
          {subtitle && !isOpen && (
            <div className="text-[11px] text-[#64748B] truncate mt-0.5">{subtitle}</div>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" />
        )}
      </button>

      {isOpen && <div className="border-t border-[#262A34]">{children}</div>}
    </div>
  );
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace());

  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [pomodoroDuration, setPomodoroDuration] = useState<PomodoroDurationMinutes>(25);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [pomodoroFinishedMessage, setPomodoroFinishedMessage] = useState(false);

  // Sync timer minutes to Reading Pacer
  const [prefilledMinutes, setPrefilledMinutes] = useState<number | null>(null);

  // PDF local file state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);

  // Split-screen sidebar accordion state
  const [openPanels, setOpenPanels] = useState<Record<SidebarPanelId, boolean>>({
    notes: true,
    ambient: true,
    lookup: false,
    pacer: false,
  });

  // Zen / Fullscreen state
  const [isZenMode, setIsZenMode] = useState(false);

  // Refs for keyboard shortcuts
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const lookupInputRef = useRef<HTMLInputElement | null>(null);

  // Persist workspace to localStorage
  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  // Sync Web Audio Engine whenever audio settings change
  useEffect(() => {
    audioEngine.sync(
      workspace.audio.volumes,
      workspace.audio.isPlaying,
      workspace.audio.isMuted,
    );
  }, [workspace.audio]);

  // Cleanup PDF blob URL on change or unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Timer tick interval
  useEffect(() => {
    if (!timerRunning) return;

    const interval = window.setInterval(() => {
      if (timerMode === 'stopwatch') {
        setElapsedSeconds((prev) => prev + 1);
      } else {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setPomodoroFinishedMessage(true);
            audioEngine.playSingingBowlChime();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning, timerMode]);

  // Sync Zen state with browser fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsZenMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const activeBook = useMemo<Book>(() => {
    return (
      workspace.books.find((b) => b.id === workspace.activeBookId) || workspace.books[0]
    );
  }, [workspace.books, workspace.activeBookId]);

  const activeNotes = useMemo(
    () => workspace.notes.filter((n) => n.bookId === activeBook.id),
    [workspace.notes, activeBook.id],
  );

  const activePins = useMemo(
    () => workspace.pins.filter((p) => p.bookId === activeBook.id),
    [workspace.pins, activeBook.id],
  );

  const activeSessions = useMemo(
    () => workspace.sessions.filter((s) => s.bookId === activeBook.id),
    [workspace.sessions, activeBook.id],
  );

  // Handlers
  const handleModeChange = (mode: AppMode) => {
    setWorkspace((prev) => ({ ...prev, mode }));
  };

  const handleToggleWarmPaper = () => {
    setWorkspace((prev) => ({ ...prev, warmPaper: !prev.warmPaper }));
  };

  const handleToggleZenMode = async () => {
    const nextZen = !isZenMode;
    setIsZenMode(nextZen);

    try {
      if (nextZen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (!nextZen && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Graceful fallback inside restricted iframes: Zen layout expansion still applies
    }
  };

  // Audio handlers
  const handleVolumeChange = (track: AmbientTrackId, value: number) => {
    setWorkspace((prev) => {
      const shouldStartPlaying = value > 0 && !prev.audio.isPlaying ? true : prev.audio.isPlaying;
      return {
        ...prev,
        audio: {
          ...prev.audio,
          isPlaying: shouldStartPlaying,
          volumes: {
            ...prev.audio.volumes,
            [track]: value,
          },
        },
      };
    });
    audioEngine.wake();
  };

  const handleTogglePlayAudio = useCallback(() => {
    setWorkspace((prev) => ({
      ...prev,
      audio: {
        ...prev.audio,
        isPlaying: !prev.audio.isPlaying,
      },
    }));
    audioEngine.wake();
  }, []);

  const handleToggleMuteAudio = () => {
    setWorkspace((prev) => ({
      ...prev,
      audio: {
        ...prev.audio,
        isMuted: !prev.audio.isMuted,
      },
    }));
  };

  // Timer handlers
  const handleTimerModeChange = (mode: TimerMode) => {
    setTimerRunning(false);
    setTimerMode(mode);
    setPomodoroFinishedMessage(false);
    if (mode === 'pomodoro') {
      setRemainingSeconds(pomodoroDuration * 60);
    }
  };

  const handlePomodoroDurationChange = (minutes: PomodoroDurationMinutes) => {
    setTimerRunning(false);
    setPomodoroDuration(minutes);
    setRemainingSeconds(minutes * 60);
    setPomodoroFinishedMessage(false);
  };

  const handleToggleTimer = useCallback(() => {
    setPomodoroFinishedMessage(false);
    if (timerMode === 'pomodoro' && remainingSeconds === 0) {
      setRemainingSeconds(pomodoroDuration * 60);
    }
    setTimerRunning((prev) => !prev);
  }, [timerMode, remainingSeconds, pomodoroDuration]);

  const handleResetTimer = () => {
    setTimerRunning(false);
    setPomodoroFinishedMessage(false);
    if (timerMode === 'stopwatch') {
      setElapsedSeconds(0);
    } else {
      setRemainingSeconds(pomodoroDuration * 60);
    }
  };

  const handleLogSessionFromTimer = (minutes: number) => {
    setPrefilledMinutes(minutes);
    if (workspace.mode === 'pdf') {
      setOpenPanels((prev) => ({ ...prev, pacer: true }));
    }
  };

  // Global keyboard shortcuts: Alt + N, Alt + K, Alt + Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        if (workspace.mode === 'pdf') {
          setOpenPanels((prev) => ({ ...prev, notes: true }));
          setTimeout(() => noteInputRef.current?.focus(), 40);
        } else {
          noteInputRef.current?.focus();
        }
      } else if (key === 'k') {
        e.preventDefault();
        if (workspace.mode === 'pdf') {
          setOpenPanels((prev) => ({ ...prev, lookup: true }));
          setTimeout(() => lookupInputRef.current?.focus(), 40);
        } else {
          lookupInputRef.current?.focus();
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
        setWorkspace((prev) => ({
          ...prev,
          audio: {
            ...prev.audio,
            isPlaying: !timerRunning,
          },
        }));
        audioEngine.wake();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspace.mode, handleToggleTimer, timerRunning]);

  // Notes handlers
  const handleAddNote = (page: number | null, category: NoteCategory, content: string) => {
    const newNote: ReadingNote = {
      id: generateId('note'),
      bookId: activeBook.id,
      page,
      category,
      content,
      createdAt: new Date().toISOString(),
    };
    setWorkspace((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
  };

  const handleDeleteNote = (noteId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  };

  // Pinboard handlers
  const handleAddPin = (term: string, description: string) => {
    const newPin: PinItem = {
      id: generateId('pin'),
      bookId: activeBook.id,
      term,
      description,
      createdAt: new Date().toISOString(),
    };
    setWorkspace((prev) => ({
      ...prev,
      pins: [newPin, ...prev.pins],
    }));
  };

  const handleDeletePin = (pinId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      pins: prev.pins.filter((p) => p.id !== pinId),
    }));
  };

  // Books & Pacer handlers
  const handleSelectBook = (bookId: string) => {
    setWorkspace((prev) => ({ ...prev, activeBookId: bookId }));
  };

  const handleAddBook = (
    title: string,
    author: string,
    totalPages: number,
    currentPage: number,
  ) => {
    const newBook: Book = {
      id: generateId('book'),
      title,
      author,
      totalPages,
      currentPage,
      createdAt: new Date().toISOString(),
    };
    setWorkspace((prev) => ({
      ...prev,
      books: [newBook, ...prev.books],
      activeBookId: newBook.id,
    }));
  };

  const handleDeleteBook = (bookId: string) => {
    setWorkspace((prev) => {
      if (prev.books.length <= 1) return prev;
      const remainingBooks = prev.books.filter((b) => b.id !== bookId);
      const nextActiveId =
        prev.activeBookId === bookId ? remainingBooks[0].id : prev.activeBookId;
      return {
        ...prev,
        books: remainingBooks,
        activeBookId: nextActiveId,
        notes: prev.notes.filter((n) => n.bookId !== bookId),
        pins: prev.pins.filter((p) => p.bookId !== bookId),
        sessions: prev.sessions.filter((s) => s.bookId !== bookId),
      };
    });
  };

  const handleLogSession = (
    startPage: number,
    endPage: number,
    durationMinutes: number,
  ) => {
    const pagesRead = Math.max(0, endPage - startPage);
    const newSession: ReadingSession = {
      id: generateId('session'),
      bookId: activeBook.id,
      startPage,
      endPage,
      pagesRead,
      durationMinutes,
      createdAt: new Date().toISOString(),
    };

    setWorkspace((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      books: prev.books.map((b) =>
        b.id === activeBook.id
          ? { ...b, currentPage: Math.max(b.currentPage, endPage) }
          : b,
      ),
    }));
  };

  // PDF handlers
  const handleSelectPdfFile = (file: File) => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setPdfName(file.name);
  };

  const handleClosePdfFile = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setPdfName(null);
  };

  const toggleSidebarPanel = (panel: SidebarPanelId) => {
    setOpenPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const liveTimerMinutes = useMemo(() => {
    if (timerMode === 'stopwatch') {
      return elapsedSeconds > 0 ? Math.max(1, Math.round(elapsedSeconds / 60)) : 0;
    }
    const elapsedPomodoro = pomodoroDuration * 60 - remainingSeconds;
    return elapsedPomodoro > 0 ? Math.max(1, Math.round(elapsedPomodoro / 60)) : 0;
  }, [timerMode, elapsedSeconds, pomodoroDuration, remainingSeconds]);

  return (
    <div
      className={`min-h-screen bg-[#0F1115] text-[#E2E8F0] flex flex-col ${
        workspace.warmPaper ? 'warm-paper-active' : ''
      }`}
    >
      {workspace.warmPaper && <div className="warm-paper-overlay" aria-hidden="true" />}

      <Header
        mode={workspace.mode}
        onModeChange={handleModeChange}
        warmPaper={workspace.warmPaper}
        onToggleWarmPaper={handleToggleWarmPaper}
        isZenMode={isZenMode}
        onToggleZenMode={handleToggleZenMode}
      />

      {/* Main Adaptive Workspace */}
      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-4 sm:px-6 flex flex-col min-h-0">
        {workspace.mode === 'paper' ? (
          /* Mode 1: Desk Companion Bento Grid */
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:h-[calc(100vh-116px)] lg:min-h-[640px]">
            {/* Left Column: Ambient/Timer + Reading Pacer */}
            <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 lg:overflow-y-auto pr-0.5">
              <AmbientTimerModule
                audio={workspace.audio}
                onVolumeChange={handleVolumeChange}
                onTogglePlayAudio={handleTogglePlayAudio}
                onToggleMuteAudio={handleToggleMuteAudio}
                timerMode={timerMode}
                onTimerModeChange={handleTimerModeChange}
                pomodoroDuration={pomodoroDuration}
                onPomodoroDurationChange={handlePomodoroDurationChange}
                timerRunning={timerRunning}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                elapsedSeconds={elapsedSeconds}
                remainingSeconds={remainingSeconds}
                pomodoroFinishedMessage={pomodoroFinishedMessage}
                onDismissPomodoroNotice={() => setPomodoroFinishedMessage(false)}
                onLogSessionFromTimer={handleLogSessionFromTimer}
              />

              <ReadingPacerModule
                books={workspace.books}
                activeBook={activeBook}
                sessions={activeSessions}
                timerElapsedMinutes={liveTimerMinutes}
                prefilledMinutes={prefilledMinutes}
                onClearPrefilledMinutes={() => setPrefilledMinutes(null)}
                onSelectBook={handleSelectBook}
                onAddBook={handleAddBook}
                onDeleteBook={handleDeleteBook}
                onLogSession={handleLogSession}
              />
            </div>

            {/* Center Column: Quick-Capture Notes */}
            <div className="lg:col-span-5 min-h-[420px] lg:min-h-0">
              <QuickNotesModule
                activeBook={activeBook}
                notes={activeNotes}
                noteInputRef={noteInputRef}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onExportMarkdown={() =>
                  exportBookNotesMarkdown(activeBook, activeNotes, activePins)
                }
                onExportJson={() =>
                  exportBookBackupJson(activeBook, activeNotes, activePins, activeSessions)
                }
              />
            </div>

            {/* Right Column: Wikipedia Lookup + Pinboard */}
            <div className="lg:col-span-3 min-h-[420px] lg:min-h-0">
              <LookupPinboardModule
                activeBook={activeBook}
                pins={activePins}
                lookupInputRef={lookupInputRef}
                onAddPin={handleAddPin}
                onDeletePin={handleDeletePin}
              />
            </div>
          </div>
        ) : (
          /* Mode 2: Split-Screen PDF Reader (65% Left / 35% Right) */
          <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-116px)] lg:min-h-[640px]">
            {/* Left Pane (65%): Embedded Local PDF Reader */}
            <div className="w-full lg:w-[65%] h-[62vh] lg:h-full min-h-[400px]">
              <PdfViewerPane
                pdfUrl={pdfUrl}
                pdfName={pdfName}
                onSelectFile={handleSelectPdfFile}
                onCloseFile={handleClosePdfFile}
              />
            </div>

            {/* Right Pane (35%): Compact Accordion Companion Sidebar */}
            <aside
              aria-label="Thanh công cụ đồng hành đọc PDF"
              className="w-full lg:w-[35%] lg:h-full lg:overflow-y-auto flex flex-col gap-3 pr-0.5"
            >
              <AccordionCard
                title="Sổ Nháp Ghi Chú Siêu Tốc"
                subtitle={`${activeBook.title} · ${activeNotes.length} ghi chú`}
                isOpen={openPanels.notes}
                onToggle={() => toggleSidebarPanel('notes')}
              >
                <div className="[&>section]:border-0 [&>section]:rounded-none max-h-[420px] flex flex-col">
                  <QuickNotesModule
                    compact
                    activeBook={activeBook}
                    notes={activeNotes}
                    noteInputRef={noteInputRef}
                    onAddNote={handleAddNote}
                    onDeleteNote={handleDeleteNote}
                    onExportMarkdown={() =>
                      exportBookNotesMarkdown(activeBook, activeNotes, activePins)
                    }
                    onExportJson={() =>
                      exportBookBackupJson(
                        activeBook,
                        activeNotes,
                        activePins,
                        activeSessions,
                      )
                    }
                  />
                </div>
              </AccordionCard>

              <AccordionCard
                title="Trạm Âm Thanh & Nhịp Đọc"
                subtitle={timerRunning ? 'Đang tính giờ phiên đọc' : 'Mưa rơi, lò sưởi, Pomodoro'}
                isOpen={openPanels.ambient}
                onToggle={() => toggleSidebarPanel('ambient')}
              >
                <div className="[&>section]:border-0 [&>section]:rounded-none">
                  <AmbientTimerModule
                    compact
                    audio={workspace.audio}
                    onVolumeChange={handleVolumeChange}
                    onTogglePlayAudio={handleTogglePlayAudio}
                    onToggleMuteAudio={handleToggleMuteAudio}
                    timerMode={timerMode}
                    onTimerModeChange={handleTimerModeChange}
                    pomodoroDuration={pomodoroDuration}
                    onPomodoroDurationChange={handlePomodoroDurationChange}
                    timerRunning={timerRunning}
                    onToggleTimer={handleToggleTimer}
                    onResetTimer={handleResetTimer}
                    elapsedSeconds={elapsedSeconds}
                    remainingSeconds={remainingSeconds}
                    pomodoroFinishedMessage={pomodoroFinishedMessage}
                    onDismissPomodoroNotice={() => setPomodoroFinishedMessage(false)}
                    onLogSessionFromTimer={handleLogSessionFromTimer}
                  />
                </div>
              </AccordionCard>

              <AccordionCard
                title="Tra Cứu & Bảng Ghim"
                subtitle={`Wikipedia · ${activePins.length} thẻ ghim`}
                isOpen={openPanels.lookup}
                onToggle={() => toggleSidebarPanel('lookup')}
              >
                <div className="[&>section]:border-0 [&>section]:rounded-none">
                  <LookupPinboardModule
                    compact
                    activeBook={activeBook}
                    pins={activePins}
                    lookupInputRef={lookupInputRef}
                    onAddPin={handleAddPin}
                    onDeletePin={handleDeletePin}
                  />
                </div>
              </AccordionCard>

              <AccordionCard
                title="Đo Nhịp Độ & Dự Báo"
                subtitle={`Trang ${activeBook.currentPage}/${activeBook.totalPages}`}
                isOpen={openPanels.pacer}
                onToggle={() => toggleSidebarPanel('pacer')}
              >
                <div className="[&>section]:border-0 [&>section]:rounded-none">
                  <ReadingPacerModule
                    compact
                    books={workspace.books}
                    activeBook={activeBook}
                    sessions={activeSessions}
                    timerElapsedMinutes={liveTimerMinutes}
                    prefilledMinutes={prefilledMinutes}
                    onClearPrefilledMinutes={() => setPrefilledMinutes(null)}
                    onSelectBook={handleSelectBook}
                    onAddBook={handleAddBook}
                    onDeleteBook={handleDeleteBook}
                    onLogSession={handleLogSession}
                  />
                </div>
              </AccordionCard>
            </aside>
          </div>
        )}
      </main>

      {/* Quiet Keyboard Shortcut Legend */}
      {!isZenMode && (
        <footer className="mx-auto w-full max-w-[1480px] px-4 pb-3 pt-1 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <kbd className="font-mono text-[#94A3B8]">Alt + N</kbd> Ghi chú nhanh
              </span>
              <span>
                <kbd className="font-mono text-[#94A3B8]">Alt + K</kbd> Tra Wikipedia
              </span>
              <span>
                <kbd className="font-mono text-[#94A3B8]">Alt + Space</kbd> Bật/tạm dừng nhịp đọc & âm thanh
              </span>
            </div>
            <span>Tự động lưu cục bộ trên trình duyệt</span>
          </div>
        </footer>
      )}
    </div>
  );
}
