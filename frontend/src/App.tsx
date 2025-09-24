import React, { useState } from 'react';
import FileUploadComponent from './components/FileUploadComponent';
import ConversionControlPanel from './components/ConversionControlPanel';
import ResultPanel from './components/ResultPanel';
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

      const response = await fetch('http://localhost:8000/api/convert', {
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
      setConversionResult(result);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              ST→ラダー変換コンバータ
            </h1>
            <div className="text-sm text-gray-500">
              自動倉庫在庫管理システム対応
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <FileUploadComponent
              onFileUpload={handleFileUpload}
              acceptedTypes=".st,.il,.txt"
              multiple={false}
            />

            {uploadedFiles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  アップロードファイル
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{file.name}</span>
                      <span className="text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ConversionControlPanel
              onConvert={handleConvert}
              isConverting={isConverting}
              disabled={uploadedFiles.length === 0}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <LadderViewComponent
              ladderData={conversionResult?.ladderData}
              width={800}
              height={600}
            />

            <ResultPanel
              results={conversionResult}
              showResults={conversionResult !== null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
