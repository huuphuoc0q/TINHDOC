import {
  CloudRain,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Waves,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type {
  AmbientTrackId,
  AudioSettings,
  PomodoroDurationMinutes,
  TimerMode,
} from '../types/reading';

interface AmbientTimerModuleProps {
  audio: AudioSettings;
  onVolumeChange: (track: AmbientTrackId, value: number) => void;
  onTogglePlayAudio: () => void;
  onToggleMuteAudio: () => void;
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
  pomodoroDuration: PomodoroDurationMinutes;
  onPomodoroDurationChange: (minutes: PomodoroDurationMinutes) => void;
  timerRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  elapsedSeconds: number;
  remainingSeconds: number;
  pomodoroFinishedMessage: boolean;
  onDismissPomodoroNotice: () => void;
  onLogSessionFromTimer: (minutes: number) => void;
  compact?: boolean;
}

const TRACKS: Array<{
  id: AmbientTrackId;
  label: string;
  Icon: typeof CloudRain;
}> = [
  { id: 'rain', label: 'Tiếng mưa rơi', Icon: CloudRain },
  { id: 'fireplace', label: 'Lò sưởi ấm', Icon: Flame },
  { id: 'brownNoise', label: 'Nhiễu nâu tập trung', Icon: Waves },
  { id: 'ambient', label: 'Nhạc nền Ambient', Icon: Sparkles },
];

function formatTime(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function AmbientTimerModule({
  audio,
  onVolumeChange,
  onTogglePlayAudio,
  onToggleMuteAudio,
  timerMode,
  onTimerModeChange,
  pomodoroDuration,
  onPomodoroDurationChange,
  timerRunning,
  onToggleTimer,
  onResetTimer,
  elapsedSeconds,
  remainingSeconds,
  pomodoroFinishedMessage,
  onDismissPomodoroNotice,
  onLogSessionFromTimer,
  compact = false,
}: AmbientTimerModuleProps) {
  const displaySeconds = timerMode === 'stopwatch' ? elapsedSeconds : remainingSeconds;
  const trackedMinutes =
    timerMode === 'stopwatch'
      ? Math.max(1, Math.round(elapsedSeconds / 60))
      : Math.max(1, Math.round((pomodoroDuration * 60 - remainingSeconds) / 60) || pomodoroDuration);

  return (
    <section
      aria-label="Trạm Âm Thanh và Nhịp Đọc"
      className={`rounded-xl border border-[#262A34] bg-[#181B20] ${compact ? 'p-4' : 'p-5'} flex flex-col gap-4`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 ${compact ? 'justify-end' : 'justify-between'}`}>
        {!compact && (
          <h2 className="text-sm font-semibold text-[#E2E8F0] tracking-wide">
            Trạm Âm Thanh & Nhịp Đọc
          </h2>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePlayAudio}
            aria-label={audio.isPlaying ? 'Tạm dừng âm thanh nền' : 'Phát âm thanh nền'}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] ${
              audio.isPlaying && !audio.isMuted
                ? 'bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/40'
                : 'bg-[#0F1115] text-[#94A3B8] border border-[#262A34] hover:text-[#E2E8F0]'
            }`}
          >
            {audio.isPlaying ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{audio.isPlaying ? 'Đang phát' : 'Phát nền'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMuteAudio}
            aria-label={audio.isMuted ? 'Bỏ tắt tiếng' : 'Tắt tiếng'}
            title={audio.isMuted ? 'Bỏ tắt tiếng' : 'Tắt tiếng'}
            className="rounded-md border border-[#262A34] bg-[#0F1115] p-1.5 text-[#94A3B8] hover:text-[#E2E8F0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
          >
            {audio.isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-[#F87171]" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Gentle Timer Block */}
      <div className="rounded-lg border border-[#262A34] bg-[#0F1115] p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {/* Timer mode selector */}
          <div className="flex items-center gap-1 rounded-md bg-[#181B20] p-0.5 border border-[#262A34]">
            <button
              type="button"
              onClick={() => onTimerModeChange('stopwatch')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                timerMode === 'stopwatch'
                  ? 'bg-[#262A34] text-[#E2E8F0]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Bấm giờ
            </button>
            <button
              type="button"
              onClick={() => onTimerModeChange('pomodoro')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                timerMode === 'pomodoro'
                  ? 'bg-[#262A34] text-[#E2E8F0]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Pomodoro
            </button>
          </div>

          {timerMode === 'pomodoro' && (
            <div className="flex items-center gap-1">
              {([25, 45, 60] as PomodoroDurationMinutes[]).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onPomodoroDurationChange(mins)}
                  className={`rounded px-2 py-0.5 font-mono text-[11px] tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                    pomodoroDuration === mins
                      ? 'bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/40'
                      : 'text-[#94A3B8] hover:text-[#E2E8F0] border border-transparent'
                  }`}
                >
                  {mins}p
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clock Display + Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-3xl font-medium tracking-tight text-[#E2E8F0] tabular-nums">
            {formatTime(displaySeconds)}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTimer}
              title="Bật/tạm dừng đồng hồ (Alt + Space)"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] ${
                timerRunning
                  ? 'bg-[#262A34] text-[#E2E8F0] hover:bg-[#323846]'
                  : 'bg-[#D97706] text-[#0F1115] hover:bg-[#F59E0B]'
              }`}
            >
              {timerRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bắt đầu</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              aria-label="Đặt lại đồng hồ"
              title="Đặt lại đồng hồ"
              className="rounded-lg border border-[#262A34] bg-[#181B20] p-1.5 text-[#94A3B8] hover:text-[#E2E8F0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Pomodoro Finished Notice */}
        {pomodoroFinishedMessage && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-[#D97706]/40 bg-[#D97706]/10 px-2.5 py-2 text-xs text-[#FDE68A]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FBBF24]" aria-hidden="true" />
              <span>Hoàn thành phiên đọc {pomodoroDuration} phút! Hãy thư giãn mắt đôi chút.</span>
            </div>
            <button
              type="button"
              onClick={onDismissPomodoroNotice}
              className="text-[11px] font-medium text-[#FBBF24] hover:underline cursor-pointer shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Sync elapsed time directly into Reading Pacer */}
        {(elapsedSeconds >= 60 || (timerMode === 'pomodoro' && remainingSeconds < pomodoroDuration * 60)) && (
          <div className="flex items-center justify-between border-t border-[#262A34] pt-2 text-xs text-[#94A3B8]">
            <span>Đã đọc phiên này: <strong className="font-mono text-[#E2E8F0] tabular-nums">{trackedMinutes} phút</strong></span>
            <button
              type="button"
              onClick={() => onLogSessionFromTimer(trackedMinutes)}
              className="font-medium text-[#38BDF8] hover:text-[#7DD3FC] transition-colors cursor-pointer whitespace-nowrap"
            >
              Ghi vào tiến độ →
            </button>
          </div>
        )}
      </div>

      {/* 4 Independent Procedural Soundscape Sliders */}
      <div className="flex flex-col gap-2.5">
        {TRACKS.map(({ id, label, Icon }) => {
          const vol = audio.volumes[id];
          return (
            <div key={id} className="flex items-center gap-3">
              <div className="flex w-40 shrink-0 items-center gap-2 text-xs text-[#CBD5E1]">
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    vol > 0 && audio.isPlaying && !audio.isMuted
                      ? 'text-[#D97706]'
                      : 'text-[#64748B]'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{label}</span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={vol}
                aria-label={`Âm lượng ${label}`}
                onChange={(e) => onVolumeChange(id, Number(e.target.value))}
                className="ambient-slider flex-1"
              />

              <span className="w-9 text-right font-mono text-[11px] text-[#94A3B8] tabular-nums">
                {vol}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
