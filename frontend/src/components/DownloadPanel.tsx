import React from 'react';

interface DownloadPanelProps {
  conversionResult?: {
    success: boolean;
    ladderData: any;
    deviceMap: any;
    errors: string[];
    warnings: string[];
    processingTime: number;
  };
  isConverting: boolean;
}

const DownloadPanel: React.FC<DownloadPanelProps> = ({ conversionResult, isConverting }) => {
  const handleDownload = (format: string) => {
    if (!conversionResult?.success) return;

    // ダウンロード処理のシミュレーション
    const filename = `ladder_program.${format}`;
    const content = format === 'gxw' ? 'GX Works format data' : 'CSV device list data';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!conversionResult) {
    return (
      <div className="glass-card p-6">
        <div className="text-center mb-6">
          <h2 className="text-glow text-xl font-bold mb-2">ラダープログラム</h2>
          <p className="text-white/80 text-sm">変換されたプログラムをダウンロード</p>
        </div>

        <div className="text-center py-12">
          <div className="icon-lg text-white/40 mx-auto mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-white/60 text-sm">変換が完了するとダウンロードが可能になります</p>
        </div>
      </div>
    );
  }

  const { success, errors = [], warnings = [], processingTime } = conversionResult;

  return (
    <div className="glass-card p-6">
      <div className="text-center mb-6">
        <h2 className="text-glow text-xl font-bold mb-2">ラダーダウンロード</h2>
        <p className="text-white/80 text-sm">変換されたプログラムをエクスポート</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${success ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-white font-medium">
              {success ? '変換成功' : '変換失敗'}
            </span>
          </div>
          <span className="text-white/60 text-sm">
            {processingTime ? processingTime.toFixed(2) : '0.00'}s
          </span>
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
            <h4 className="text-red-300 text-xs font-medium mb-2">エラー</h4>
            <div className="text-red-200 text-xs space-y-1">
              {errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-xl">
            <h4 className="text-yellow-300 text-xs font-medium mb-2">警告</h4>
            <div className="text-yellow-200 text-xs space-y-1">
              {warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </div>
        )}

        {success && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleDownload('gxw')}
                disabled={isConverting}
                className="btn-modern disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>GX Works形式</span>
              </button>

              <button
                onClick={() => handleDownload('csv')}
                disabled={isConverting}
                className="btn-secondary-modern disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>CSVデバイスリスト</span>
              </button>

              <button
                onClick={() => handleDownload('report')}
                disabled={isConverting}
                className="btn-secondary-modern disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>変換レポート</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadPanel;