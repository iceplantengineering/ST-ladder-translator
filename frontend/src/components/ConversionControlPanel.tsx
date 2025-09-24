import React from 'react';

interface ConversionControlPanelProps {
  onConvert: (options: ConversionOptions) => void;
  isConverting: boolean;
  disabled?: boolean;
}

interface ConversionOptions {
  plcType: 'mitsubishi' | 'omron' | 'keyence';
  optimizeDeviceUsage: boolean;
  generateReport: boolean;
  outputFormat: 'gxw' | 'csv' | 'both';
}

const ConversionControlPanel: React.FC<ConversionControlPanelProps> = ({
  onConvert,
  isConverting,
  disabled = false
}) => {
  const [options, setOptions] = React.useState<ConversionOptions>({
    plcType: 'mitsubishi',
    optimizeDeviceUsage: true,
    generateReport: true,
    outputFormat: 'both'
  });

  const handleOptionChange = (key: keyof ConversionOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleConvert = () => {
    onConvert(options);
  };

  return (
    <div className="glass-card-dark p-6">
      <div className="text-center mb-6">
        <h2 className="text-glow text-lg font-bold mb-2">変換設定</h2>
        <p className="text-white/80 text-sm">ラダープログラムの変換オプション</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white font-medium text-sm mb-2">
            PLCメーカー
          </label>
          <select
            value={options.plcType}
            onChange={(e) => handleOptionChange('plcType', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
          >
            <option value="mitsubishi" className="bg-gray-800">三菱電機</option>
            <option value="omron" className="bg-gray-800">オムロン</option>
            <option value="keyence" className="bg-gray-800">キーエンス</option>
          </select>
        </div>

        <div>
          <label className="block text-white font-medium text-sm mb-2">
            出力形式
          </label>
          <select
            value={options.outputFormat}
            onChange={(e) => handleOptionChange('outputFormat', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
          >
            <option value="gxw" className="bg-gray-800">GX Works形式 (.gxw)</option>
            <option value="csv" className="bg-gray-800">CSVデバイスリスト</option>
            <option value="both" className="bg-gray-800">両方出力</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.optimizeDeviceUsage}
              onChange={(e) => handleOptionChange('optimizeDeviceUsage', e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded bg-white/10"
            />
            <span className="ml-2 text-white text-sm">
              デバイス使用量を最適化
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.generateReport}
              onChange={(e) => handleOptionChange('generateReport', e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded bg-white/10"
            />
            <span className="ml-2 text-white text-sm">
              変換レポートを生成
            </span>
          </label>
        </div>

        <button
          onClick={handleConvert}
          disabled={disabled || isConverting}
          className="btn-modern w-full disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {isConverting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>変換中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>変換実行</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConversionControlPanel;