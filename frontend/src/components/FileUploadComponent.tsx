import React from 'react';

interface FileUploadComponentProps {
  onFileUpload: (files: File[]) => void;
  acceptedTypes?: string;
  multiple?: boolean;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileUpload,
  acceptedTypes = '.st,.il,.txt',
  multiple = true
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['.st', '.il', '.txt'].includes(`.${extension}`);
    });

    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  }, [onFileUpload]);

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  return (
    <div className="glass-card p-6">
      <div className="text-center mb-6">
        <h2 className="text-glow text-xl font-bold mb-2">STファイルアップロード</h2>
        <p className="text-white/80 text-sm">構造化言語ファイルをドラッグ＆ドロップ</p>
      </div>

      <div
        className={`upload-zone ${isDragOver ? 'upload-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-8 h-8 text-white/60">
              <svg fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          <div>
            <p className="text-white font-medium text-base">
              ファイルをドロップまたは選択
            </p>
            <p className="text-white/60 text-sm mt-1">
              ST, IL, TXT形式に対応
            </p>
          </div>

          <input
            type="file"
            accept={acceptedTypes}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="btn-modern cursor-pointer inline-block"
          >
            ファイルを選択
          </label>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-white/60 text-xs">
          <span>対応ファイル形式</span>
          <span className="text-accent font-mono">.st, .il, .txt</span>
        </div>
        <div className="flex items-center justify-between text-white/60 text-xs">
          <span>最大ファイルサイズ</span>
          <span className="text-accent">10MB</span>
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;