import React from 'react';

interface ResultPanelProps {
  results?: {
    success: boolean;
    ladderData: any;
    deviceMap: any;
    errors: string[];
    warnings: string[];
    processingTime: number;
  };
  showResults: boolean;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ results, showResults }) => {
  if (!showResults || !results) {
    return null;
  }

  const { success, errors, warnings, processingTime, deviceMap } = results;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">変換結果</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              success
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {success ? '成功' : '失敗'}
            </span>
            <span className="text-sm text-gray-500">
              処理時間: {processingTime.toFixed(2)}秒
            </span>
          </div>

          {errors.length > 0 && (
            <div className="border-l-4 border-red-400 bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">エラー</h4>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc space-y-1 pl-5">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">警告</h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc space-y-1 pl-5">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && deviceMap && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">デバイス割り当て</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(deviceMap).map(([type, devices]: [string, any]) => (
                  <div key={type}>
                    <h5 className="text-sm font-medium text-gray-700 capitalize mb-2">
                      {type === 'inputs' ? '入力' :
                       type === 'outputs' ? '出力' :
                       type === 'internals' ? '内部' :
                       type === 'timers' ? 'タイマー' :
                       type === 'counters' ? 'カウンタ' : type}
                    </h5>
                    {Object.keys(devices).length > 0 ? (
                      <div className="text-xs text-gray-600 space-y-1">
                        {Object.entries(devices).slice(0, 5).map(([addr, desc]: [string, any]) => (
                          <div key={addr} className="flex justify-between">
                            <span className="font-mono">{addr}</span>
                            <span className="truncate ml-2">{desc as string}</span>
                          </div>
                        ))}
                        {Object.keys(devices).length > 5 && (
                          <div className="text-gray-400 italic">
                            他 {Object.keys(devices).length - 5} 件...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">なし</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {success && (
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                GX Worksダウンロード
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                CSVダウンロード
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                レポート表示
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;