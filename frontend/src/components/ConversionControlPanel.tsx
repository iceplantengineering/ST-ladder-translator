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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">変換設定</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PLCメーカー
          </label>
          <select
            value={options.plcType}
            onChange={(e) => handleOptionChange('plcType', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="mitsubishi">三菱電機</option>
            <option value="omron">オムロン</option>
            <option value="keyence">キーエンス</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出力形式
          </label>
          <select
            value={options.outputFormat}
            onChange={(e) => handleOptionChange('outputFormat', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gxw">GX Works形式 (.gxw)</option>
            <option value="csv">CSVデバイスリスト</option>
            <option value="both">両方出力</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.optimizeDeviceUsage}
              onChange={(e) => handleOptionChange('optimizeDeviceUsage', e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              デバイス使用量を最適化
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.generateReport}
              onChange={(e) => handleOptionChange('generateReport', e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              変換レポートを生成
            </span>
          </label>
        </div>

        <button
          onClick={handleConvert}
          disabled={disabled || isConverting}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConverting ? '変換中...' : '変換実行'}
        </button>
      </div>
    </div>
  );
};

export default ConversionControlPanel;