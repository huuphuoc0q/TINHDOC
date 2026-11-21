import { BookOpen, FileText, Maximize2, Minimize2, SunMedium } from 'lucide-react';
import type { AppMode } from '../types/reading';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  warmPaper: boolean;
  onToggleWarmPaper: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
}

export function Header({
  mode,
  onModeChange,
  warmPaper,
  onToggleWarmPaper,
  isZenMode,
  onToggleZenMode,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#262A34] bg-[#0F1115]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-serif text-xl font-semibold tracking-tight text-[#E2E8F0] whitespace-nowrap">
            Tĩnh Đọc
          </span>
        </div>

        {/* Prominent Dual-Mode Segmented Switcher */}
        <div
          role="tablist"
          aria-label="Chế độ không gian đọc"
          className="flex items-center gap-1 rounded-lg border border-[#262A34] bg-[#181B20] p-1 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'paper'}
            onClick={() => onModeChange('paper')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] ${
              mode === 'paper'
                ? 'bg-[#D97706] text-[#0F1115] font-semibold'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Chế độ Sách Giấy</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'pdf'}
            onClick={() => onModeChange('pdf')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] ${
              mode === 'pdf'
                ? 'bg-[#D97706] text-[#0F1115] font-semibold'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Chế độ Đọc PDF</span>
          </button>
        </div>

        {/* Eye-care & Zen Fullscreen Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-pressed={warmPaper}
            onClick={onToggleWarmPaper}
            title="Bật/tắt bộ lọc Giấy Ấm dịu mắt"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] ${
              warmPaper
                ? 'border-[#D97706]/60 bg-[#D97706]/15 text-[#FBBF24]'
                : 'border-[#262A34] bg-[#181B20] text-[#94A3B8] hover:border-[#363C4A] hover:text-[#E2E8F0]'
            }`}
          >
            <SunMedium className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Giấy ấm</span>
          </button>

          <button
            type="button"
            aria-pressed={isZenMode}
            onClick={onToggleZenMode}
            title="Chế độ tĩnh tâm / Toàn màn hình"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
              isZenMode
                ? 'border-[#38BDF8]/60 bg-[#38BDF8]/15 text-[#38BDF8]'
                : 'border-[#262A34] bg-[#181B20] text-[#94A3B8] hover:border-[#363C4A] hover:text-[#E2E8F0]'
            }`}
          >
            {isZenMode ? (
              <Minimize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isZenMode ? 'Thoát tĩnh tâm' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
