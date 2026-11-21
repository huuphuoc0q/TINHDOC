import { useState, type FormEvent, type RefObject } from 'react';
import { Loader2, Pin, Plus, Search, Trash2, X } from 'lucide-react';
import type { Book, PinItem } from '../types/reading';
import { lookupWikipedia, type WikiLookupResult } from '../utils/wikipedia';

interface LookupPinboardModuleProps {
  activeBook: Book;
  pins: PinItem[];
  lookupInputRef: RefObject<HTMLInputElement | null>;
  onAddPin: (term: string, description: string) => void;
  onDeletePin: (pinId: string) => void;
  compact?: boolean;
}

export function LookupPinboardModule({
  activeBook,
  pins,
  lookupInputRef,
  onAddPin,
  onDeletePin,
  compact = false,
}: LookupPinboardModuleProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WikiLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [pinTerm, setPinTerm] = useState('');
  const [pinDesc, setPinDesc] = useState('');

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setLookupError(null);
    const data = await lookupWikipedia(trimmed);
    setLoading(false);

    if (data) {
      setResult(data);
    } else {
      setResult(null);
      setLookupError(`Không tìm thấy mục từ "${trimmed}" trên Wikipedia tiếng Việt hoặc tiếng Anh.`);
    }
  };

  const handlePinFromWiki = () => {
    if (!result) return;
    const shortExtract =
      result.extract.length > 160 ? `${result.extract.slice(0, 157).trim()}...` : result.extract;
    onAddPin(result.title, shortExtract);
  };

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!pinTerm.trim() || !pinDesc.trim()) return;
    onAddPin(pinTerm.trim(), pinDesc.trim());
    setPinTerm('');
    setPinDesc('');
  };

  return (
    <section
      aria-label="Trạm Tra Cứu và Bảng Ghim"
      className={`rounded-xl border border-[#262A34] bg-[#181B20] ${
        compact ? 'p-4' : 'p-5'
      } flex flex-col gap-4 h-full min-h-0`}
    >
      {/* Header */}
      {!compact && (
        <div>
          <h2 className="text-sm font-semibold text-[#E2E8F0] tracking-wide">
            Tra Cứu & Bảng Ghim
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Tra nhanh Wikipedia không quảng cáo · Ghim nhân vật
          </p>
        </div>
      )}

      {/* Distraction-Free Wikipedia Lookup */}
      <div className="flex flex-col gap-2.5">
        <form onSubmit={handleLookup} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <input
              ref={lookupInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tra Wikipedia... (Alt+K)"
              className="w-full rounded-lg border border-[#262A34] bg-[#0F1115] pl-8 pr-2.5 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:border-[#38BDF8] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border border-[#262A34] bg-[#0F1115] px-3 py-2 text-xs font-medium text-[#38BDF8] hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/10 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tra'}
          </button>
        </form>

        {result && (
          <div className="rounded-lg border border-[#262A34] bg-[#0F1115] p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-[#E2E8F0]">{result.title}</h3>
                <span className="text-[11px] text-[#64748B]">
                  Wikipedia {result.lang === 'vi' ? 'Tiếng Việt' : 'English'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePinFromWiki}
                  title="Ghim kết quả này vào bảng ghim"
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[#FBBF24] hover:bg-[#D97706]/15 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  <span>Ghim</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  aria-label="Đóng kết quả tra cứu"
                  className="rounded p-1 text-[#64748B] hover:text-[#E2E8F0] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#CBD5E1] line-clamp-4">
              {result.extract}
            </p>
          </div>
        )}

        {lookupError && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#262A34] bg-[#0F1115] px-3 py-2 text-xs text-[#94A3B8]">
            <span>{lookupError}</span>
            <button
              type="button"
              onClick={() => setLookupError(null)}
              aria-label="Đóng thông báo"
              className="text-[#64748B] hover:text-[#E2E8F0] cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Pinboard Section */}
      <div className="flex flex-col gap-2.5 border-t border-[#262A34] pt-3 flex-1 min-h-0">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#CBD5E1]">
            Bảng Ghim · {activeBook.title}
          </span>
          <span className="font-mono text-[#64748B] tabular-nums">{pins.length} mục</span>
        </div>

        {/* Quick Add Pin Form */}
        <form onSubmit={handlePinSubmit} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={pinTerm}
              onChange={(e) => setPinTerm(e.target.value)}
              placeholder="Tên nhân vật / Thuật ngữ"
              className="w-full rounded-md border border-[#262A34] bg-[#0F1115] px-2.5 py-1.5 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:border-[#D97706] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={pinDesc}
              onChange={(e) => setPinDesc(e.target.value)}
              placeholder="Mô tả ngắn gọn..."
              className="flex-1 rounded-md border border-[#262A34] bg-[#0F1115] px-2.5 py-1.5 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:border-[#D97706] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Thêm vào bảng ghim"
              className="flex items-center gap-1 rounded-md bg-[#262A34] px-2.5 py-1.5 text-xs font-medium text-[#E2E8F0] hover:bg-[#323846] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ghim</span>
            </button>
          </div>
        </form>

        {/* Pinned Cards List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[140px]">
          {pins.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#262A34] bg-[#0F1115]/40 px-3 py-6 text-center">
              <p className="text-xs font-medium text-[#94A3B8]">Chưa có thẻ ghim nào</p>
              <p className="text-[11px] text-[#64748B] mt-1">
                Lưu nhân vật phụ, bối cảnh hoặc thuật ngữ khó để tra lại ngay lập tức.
              </p>
            </div>
          ) : (
            pins.map((pin) => (
              <div
                key={pin.id}
                className="group rounded-lg border border-[#262A34] bg-[#0F1115] px-3 py-2.5 transition-colors hover:border-[#363C4A]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-[#FBBF24]">{pin.term}</span>
                  <button
                    type="button"
                    onClick={() => onDeletePin(pin.id)}
                    aria-label={`Bỏ ghim ${pin.term}`}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-0.5 text-[#64748B] hover:text-[#F87171] transition-opacity cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-[#CBD5E1] mt-1">{pin.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
