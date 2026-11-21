import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { FileText, Upload, X } from 'lucide-react';

interface PdfViewerPaneProps {
  pdfUrl: string | null;
  pdfName: string | null;
  onSelectFile: (file: File) => void;
  onCloseFile: () => void;
}

export function PdfViewerPane({
  pdfUrl,
  pdfName,
  onSelectFile,
  onCloseFile,
}: PdfViewerPaneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Vui lòng chọn tệp có định dạng PDF (.pdf).');
      return;
    }
    setFileError(null);
    onSelectFile(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#262A34] bg-[#181B20] overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      {pdfUrl ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-[#262A34] bg-[#0F1115] px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
              <span className="truncate text-xs font-medium text-[#E2E8F0]">
                {pdfName || 'Tài liệu PDF'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-[#262A34] bg-[#181B20] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] hover:text-[#E2E8F0] transition-colors cursor-pointer whitespace-nowrap"
              >
                Đổi tệp khác
              </button>
              <button
                type="button"
                onClick={onCloseFile}
                aria-label="Đóng tệp PDF"
                className="rounded-md border border-[#262A34] bg-[#181B20] p-1 text-[#94A3B8] hover:text-[#F87171] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <iframe
            src={pdfUrl}
            title={pdfName || 'Trình đọc PDF Tĩnh Đọc'}
            className="h-full w-full flex-1 bg-[#0F1115] border-0"
          />
        </>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-1 flex-col items-center justify-center p-8 text-center transition-colors ${
            isDragging ? 'bg-[#D97706]/10' : 'bg-[#0F1115]/40'
          }`}
        >
          <div
            className={`flex max-w-md flex-col items-center rounded-2xl border border-dashed p-8 transition-colors ${
              isDragging ? 'border-[#D97706] bg-[#181B20]' : 'border-[#262A34] bg-[#181B20]/60'
            }`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#262A34] bg-[#0F1115] text-[#D97706]">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </div>

            <h3 className="text-base font-semibold text-[#E2E8F0]">
              Mở sách PDF từ máy tính
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Kéo và thả tệp <span className="font-mono text-[#CBD5E1]">.pdf</span> vào đây hoặc chọn từ thư mục. Tệp được đọc hoàn toàn cục bộ trên trình duyệt, không tải lên máy chủ.
            </p>

            {fileError && (
              <p className="mt-3 text-xs font-medium text-[#F87171]">{fileError}</p>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 rounded-lg bg-[#D97706] px-4 py-2 text-xs font-semibold text-[#0F1115] hover:bg-[#F59E0B] transition-colors cursor-pointer"
            >
              Chọn tệp PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
