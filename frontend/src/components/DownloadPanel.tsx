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
  const generateCSV = () => {
    if (!conversionResult?.deviceMap) return '';

    const { deviceMap } = conversionResult;
    let csv = 'デバイスアドレス,変数名,種類\n';

    // 入力デバイス
    Object.entries(deviceMap.inputs || {}).forEach(([address, name]) => {
      csv += `${address},${name},入力\n`;
    });

    // 出力デバイス
    Object.entries(deviceMap.outputs || {}).forEach(([address, name]) => {
      csv += `${address},${name},出力\n`;
    });

    // 内部リレー
    Object.entries(deviceMap.internals || {}).forEach(([address, name]) => {
      csv += `${address},${name},内部\n`;
    });

    // タイマー
    Object.entries(deviceMap.timers || {}).forEach(([address, name]) => {
      csv += `${address},${name},タイマー\n`;
    });

    // カウンター
    Object.entries(deviceMap.counters || {}).forEach(([address, name]) => {
      csv += `${address},${name},カウンター\n`;
    });

    return csv;
  };

  const generateReport = () => {
    if (!conversionResult) return '';

    const { ladderData, deviceMap, processingTime, errors, warnings } = conversionResult;
    const timestamp = new Date().toLocaleString('ja-JP');

    let report = `ST → ラダー変換レポート\n`;
    report += `生成日時: ${timestamp}\n`;
    report += `処理時間: ${processingTime?.toFixed(3) || 0}秒\n\n`;

    report += `=== 変換サマリー ===\n`;
    report += `総ラング数: ${ladderData?.rungs?.length || 0}\n`;

    const totalElements = ladderData?.rungs?.reduce((sum, rung) => sum + (rung.elements?.length || 0), 0) || 0;
    report += `総要素数: ${totalElements}\n\n`;

    // デバイス統計
    report += `=== デバイス統計 ===\n`;
    report += `入力デバイス: ${Object.keys(deviceMap?.inputs || {}).length}\n`;
    report += `出力デバイス: ${Object.keys(deviceMap?.outputs || {}).length}\n`;
    report += `内部リレー: ${Object.keys(deviceMap?.internals || {}).length}\n`;
    report += `タイマー: ${Object.keys(deviceMap?.timers || {}).length}\n`;
    report += `カウンター: ${Object.keys(deviceMap?.counters || {}).length}\n\n`;

    // デバイス詳細
    if (deviceMap) {
      report += `=== デバイス詳細 ===\n`;

      if (Object.keys(deviceMap.inputs || {}).length > 0) {
        report += `[入力デバイス]\n`;
        Object.entries(deviceMap.inputs).forEach(([address, name]) => {
          report += `  ${address}: ${name}\n`;
        });
        report += '\n';
      }

      if (Object.keys(deviceMap.outputs || {}).length > 0) {
        report += `[出力デバイス]\n`;
        Object.entries(deviceMap.outputs).forEach(([address, name]) => {
          report += `  ${address}: ${name}\n`;
        });
        report += '\n';
      }
    }

    // ラング詳細
    if (ladderData?.rungs) {
      report += `=== ラング詳細 ===\n`;
      ladderData.rungs.forEach((rung, index) => {
        report += `ラング ${index + 1}:\n`;
        if (rung.elements) {
          rung.elements.forEach((element, elementIndex) => {
            const desc = element.description || element.address || `${element.type} ${elementIndex + 1}`;
            report += `  ${elementIndex + 1}. ${desc}\n`;
          });
        }
        report += '\n';
      });
    }

    // エラーと警告
    if (errors && errors.length > 0) {
      report += `=== エラー ===\n`;
      errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }

    if (warnings && warnings.length > 0) {
      report += `=== 警告 ===\n`;
      warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    return report;
  };

  const handleDownload = (format: string) => {
    if (!conversionResult?.success) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        content = generateCSV();
        filename = `device_list_${new Date().toISOString().slice(0, 10)}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;

      case 'report':
        content = generateReport();
        filename = `conversion_report_${new Date().toISOString().slice(0, 10)}.txt`;
        mimeType = 'text/plain;charset=utf-8;';
        break;

      case 'gxw':
      default:
        // GX Works形式のシミュレーション
        content = generateGXWFormat();
        filename = `ladder_program_${new Date().toISOString().slice(0, 10)}.gxw`;
        mimeType = 'text/plain;charset=utf-8;';
        break;
    }

    // BOMを追加してExcelでの文字化けを防止
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blobContent = new Blob([bom, content], { type: mimeType });
    const url = URL.createObjectURL(blobContent);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateGXWFormat = () => {
    if (!conversionResult?.ladderData) return '';

    const { ladderData } = conversionResult;
    let gxw = `; GX Works 2 形式ラダープログラム\n`;
    gxw += `; 生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

    gxw += `*** MAIN ***\n`;

    ladderData.rungs.forEach((rung, rungIndex) => {
      gxw += `\n// ラング ${rungIndex + 1}\n`;

      if (rung.elements) {
        rung.elements.forEach((element, elementIndex) => {
          const address = element.address || '';

          switch (element.type) {
            case 'contact':
              const contactSymbol = element.isNormallyOpen === false ? 'b' : 'a';
              gxw += `LD ${contactSymbol}${address}\n`;
              break;

            case 'coil':
              gxw += `OUT ${address}\n`;
              break;

            case 'function':
              gxw += `; ${element.label || 'FUNCTION'} ${address}\n`;
              break;
          }
        });
      }

      gxw += `// ラング終了\n`;
    });

    return gxw;
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