import React, { useState } from 'react';
import FileUploadComponent from './components/FileUploadComponent';
import ConversionControlPanel from './components/ConversionControlPanel';
import DownloadPanel from './components/DownloadPanel';
import LadderViewComponent from './components/LadderViewComponent';

interface ConversionResult {
  success: boolean;
  ladderData: any;
  deviceMap: any;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // テスト用のサンプルデータ
  const sampleData: ConversionResult = {
    success: true,
    ladderData: {
      rungs: [
        {
          elements: [
            { type: 'contact', address: 'X0', description: 'SensorA', isNormallyOpen: true, x: 40, y: 30 },
            { type: 'contact', address: 'X1', description: 'SensorB', isNormallyOpen: true, x: 120, y: 30 },
            { type: 'coil', address: 'Y0', description: 'Motor1', x: 200, y: 30 }
          ]
        },
        {
          elements: [
            { type: 'contact', address: 'X2', description: 'Button1', isNormallyOpen: true, x: 40, y: 30 },
            { type: 'contact', address: 'X3', description: 'Button2', isNormallyOpen: true, x: 120, y: 30 },
            { type: 'coil', address: 'Y1', description: 'Lamp1', x: 200, y: 30 }
          ]
        }
      ],
      metadata: {
        plcType: 'mitsubishi',
        generatedAt: new Date().toISOString()
      }
    },
    deviceMap: {
      inputs: { X0: 'SensorA', X1: 'SensorB', X2: 'Button1', X3: 'Button2' },
      outputs: { Y0: 'Motor1', Y1: 'Lamp1' },
      internals: {},
      timers: {},
      counters: {}
    },
    errors: [],
    warnings: [],
    processingTime: 0.1
  };

  // デバッグ用にサンプルデータを自動設定
  React.useEffect(() => {
    // テスト用にサンプルデータを設定
    setConversionResult(sampleData);
  }, []);

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
    setConversionResult(null);
  };

  const handleConvert = async (options: any) => {
    if (uploadedFiles.length === 0) return;

    setIsConverting(true);

    try {
      const file = uploadedFiles[0];
      const content = await file.text();

      const apiUrl = import.meta.env.PROD
        ? 'https://st-ladder-translator.onrender.com/api/convert'
        : 'http://localhost:8000/api/convert';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: content,
          plc_type: options.plcType,
          options: {
            optimize_device_usage: options.optimizeDeviceUsage,
            generate_report: options.generateReport,
            output_format: options.outputFormat,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Conversion result:', result);
      console.log('Ladder data:', result.ladder_data);

      // プロパティ名をキャメルケースに変換
      const convertedResult = {
        ...result,
        ladderData: result.ladder_data,
        deviceMap: result.device_map
      };
      setConversionResult(convertedResult);
    } catch (error) {
      console.error('Conversion failed:', error);
      setConversionResult({
        success: false,
        ladderData: { rungs: [], metadata: { plcType: 'mitsubishi', generatedAt: new Date().toISOString() } },
        deviceMap: {},
        errors: [`変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`],
        warnings: [],
        processingTime: 0,
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="glass-card border-0 m-4 mt-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-glow text-2xl font-bold">
                ST <span className="text-white/80">→</span> ラダー変換コンバータ
              </h1>
              <p className="text-white/70 text-sm mt-1">構造化言語をラダーダイアグラムに変換</p>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-xs">自動倉庫在庫管理システム</div>
              <div className="gradient-text text-xs font-semibold">MVP Edition</div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {/* 左右並列レイアウト */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 左側: アップロード */}
          <div className="space-y-4">
            <FileUploadComponent
              onFileUpload={handleFileUpload}
              acceptedTypes=".st,.il,.txt"
              multiple={false}
            />

            {uploadedFiles.length > 0 && (
              <div className="glass-card-dark p-4">
                <h4 className="text-white font-medium text-sm mb-2">
                  アップロードファイル
                </h4>
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-white/80">
                      <span className="truncate">{file.name}</span>
                      <span className="text-accent font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右側: ダウンロード */}
          <div>
            <DownloadPanel
              conversionResult={conversionResult}
              isConverting={isConverting}
            />
          </div>
        </div>

        {/* 中央: コントロールパネル */}
        <div className="mb-6">
          <ConversionControlPanel
            onConvert={handleConvert}
            isConverting={isConverting}
            disabled={uploadedFiles.length === 0}
          />
        </div>

        {/* 下部: ラダービュー */}
        <div className="modern-card" style={{ minHeight: '500px' }}>
          <LadderViewComponent
            ladderData={conversionResult?.ladderData}
            width={1000}
            height={500}
          />
        </div>
      </main>
    </div>
  );
}

export default App