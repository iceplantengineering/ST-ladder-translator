# ST → Ladder 変換コンバータ

構造化言語（ST/IL）から三菱PLCラダープログラムに自動変換するWebアプリケーション

[![Netlify Status](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)](https://netlify.com)
[![Render Status](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com)

## 🚀 概要

自動倉庫の在庫管理システムを対象とした、構造化言語からラダーロジックへの自動変換ツールです。IF文、代入文などの基本的なSTコードを解析し、三菱PLCデバイス（X,Y,M,D,T,C）に適切に割り当てます。

## ✅ 機能特徴

- **ファイルアップロード**: ドラッグ&ドロップ対応（.st, .il, .txt）
- **構文解析**: IF-THEN-ELSE文、代入文、変数宣言の解析
- **自動変換**: STコード → ラダーロジック変換
- **リアルタイムプレビュー**: Canvasベースのラダーダイアグラム表示
- **インタラクティブ操作**: ズーム、パン機能付き
- **デバイス割り当て**: 三菱PLCアドレス自動割り当て
- **エラー処理**: 詳細なエラー・警告表示
- **変換レポート**: 処理時間、デバイスマップ表示

## 🛠️ 技術スタック

### フロントエンド
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** (スタイリング)
- **Canvas API** (ラダーダイアグラム描画)

### バックエンド
- **Python 3.9** + **FastAPI**
- **UVicorn** (ASGIサーバー)
- **独自パーサー** (STコード解析)
- **変換エンジン** (ラダーロジック生成)

### デプロイ
- **Netlify** (フロントエンドホスティング)
- **Render** (バックエンドAPI)

## 📦 インストールと実行

### 前提条件
- Node.js 18+
- Python 3.11+
- npm または yarn

### セットアップ手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/iceplantengineering/ST-ladder-translator.git
cd ST-ladder-translator
```

2. **依存関係のインストール**
```bash
npm run install:all
```

3. **開発サーバーの起動**
```bash
npm run dev
```

### 個別起動

**フロントエンドのみ:**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

**バックエンドのみ:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# http://localhost:8000
```

## 🎯 使用方法

1. **ファイルアップロード**
   - `.st`, `.il`, `.txt` ファイルをドラッグ&ドロップ
   - または「ファイルを選択」ボタンから選択

2. **変換設定**
   - PLCメーカーを選択（現在は三菱電機対応）
   - 出力形式を選択（GX Works、CSV、または両方）
   - オプション設定（デバイス最適化、レポート生成）

3. **変換実行**
   - 「変換実行」ボタンをクリック
   - 数秒で変換完了

4. **結果確認**
   - ラダーダイアグラムのリアルタイムプレビュー
   - ズーム・パン操作で詳細確認
   - デバイス割り当て状況の確認
   - 変換レポートの表示

## 📝 サンプルコード

### 入力STコード例
```st
// 自動倉庫制御プログラム
VAR
    sensor : BOOL;
    motor : BOOL;
    conveyor : BOOL;
END_VAR

// 制御ロジック
IF sensor THEN
    motor := TRUE;
    conveyor := TRUE;
ELSE
    motor := FALSE;
    conveyor := FALSE;
END_IF;

// カウントアップ
count := count + 1;
```

### 生成されるラダーロジック
- **ランク1**: IF文の条件分岐（X0 → M0）
- **ランク2-3**: THENブロックの代入処理（M1 → Y0, M2 → Y1）
- **ランク4-5**: ELSEブロックの代入処理（M3 → Y2, M4 → Y3）
- **ランク6-7**: 単独代入文（M5 → Y4, M6 → Y5）

## 🔧 APIリファレンス

### POST /api/convert
STコードをラダーロジックに変換

**リクエスト:**
```json
{
  "source_code": "IF sensor THEN motor := TRUE; END_IF;",
  "plc_type": "mitsubishi",
  "options": {
    "optimize_device_usage": true,
    "generate_report": true,
    "output_format": "both"
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "ladder_data": {
    "rungs": [...],
    "metadata": {
      "plc_type": "mitsubishi",
      "generated_at": "2025-09-24T21:22:04.697932"
    }
  },
  "device_map": {
    "inputs": {"X0": "sensor"},
    "outputs": {"Y0": "motor = TRUE"},
    "internals": {"M0": "IF condition result"},
    "timers": {},
    "counters": {}
  },
  "errors": [],
  "warnings": [],
  "processing_time": 0.000079
}
```

### GET /api/health
ヘルスチェック

### POST /api/upload-convert
ファイルアップロード＆変換

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Parser/Conv  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ React UI  │  │◄──►│  │ FastAPI   │  │◄──►│  │ ST Parser │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ Canvas    │  │    │  │ CORS      │  │    │  │ Ladder    │  │
│  │ Viewer    │  │    │  │ Middleware│  │    │  │ Converter │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 コンポーネント構成

### フロントエンドコンポーネント
- **FileUploadComponent**: ドラッグ&ドロップファイルアップロード
- **ConversionControlPanel**: 変換設定パネル
- **ResultPanel**: 変換結果表示
- **LadderViewComponent**: Canvasベースラダービューア

### バックエンドモジュール
- **StructuredLanguageParser**: STコード構文解析
- **LadderConverter**: ラダーロジック変換エンジン
- **FastAPI Application**: REST APIサーバー

## 🚀 デプロイ

### Netlify（フロントエンド）
1. GitHubリポジトリをNetlifyに接続
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Node.js version: 20.19.0

### Render（バックエンド）
1. GitHubリポジトリをRenderに接続
2. Runtime: Python 3.13.4
3. Build command: `pip install -r requirements.txt`
4. Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Health check path: `/api/health`
6. Working directory: `. (root directory)`

**重要な修正点:**
- `requirements.txt` の配置: `backend/requirements.txt` をルートディレクトリにコピー
- Pythonバージョン互換性: Python 3.13対応のためパッケージを最新版に更新
  - FastAPI: 0.104.1 → 0.115.6
  - Uvicorn: 0.24.0 → 0.30.6
  - その他全パッケージを最新版に更新
- フロントエンドAPIエンドポイント: `https://st-ladder-translator.onrender.com/api/convert` を指定

### 環境変数
- `NODE_VERSION`: 20.19.0 (Netlify)
- `PYTHON_VERSION`: 3.9.0 (Render)

### デプロイ状態 ✅
- **Netlify**: LIVE - https://st-ladder-translator.netlify.app
- **Render**: LIVE - https://st-ladder-translator.onrender.com
- **API連携**: 正常動作確認済み
- **変換機能**: 完全に動作しています

**サービス稼働状況:**
- 24時間365日自動稼働
- PCシャットダウン後もアクセス可能
- GitHub連携による自動デプロイ完了

## 🔧 修正履歴

### 2025-09-26 - ラダープレビュー表示の重大な不具合修正

**問題点:**
- ラダーダイアグラムプレビューで複数のラングが表示されず、1行しか表示されない問題
- 条件が直列している場合でも全てのラングが描画されない
- Canvas座標系と変換行列の問題により要素が可視領域外に描画されていた

**修正内容:**
1. **Canvas座標系の再設計**
   - 複雑な変換行列（scale, offset）を一時的に無効化
   - 固定座標システムを導入し、要素を予測可能な位置に描画

2. **描画ロジックの最適化**
   - `drawLadderRungsFixed()` 関数を新規実装
   - 各ラングに120pxの垂直スペースを確保
   - 要素間の水平間隔を150pxに設定
   - パワーレールを左端（x=30）に固定配置

3. **要素描画機能の改善**
   - `drawContactFixed()` と `drawCoilFixed()` 関数を実装
   - 接点（CONTACT）とコイル（COIL）を明確に描画
   - アドレスラベルを要素下部に表示（青：入力、赤：出力）
   - 接続線を確実に描画

4. **Canvasサイズ計算の改善**
   - 動的なキャンバスサイズ計算を実装
   - ラング数と要素数に基づいて最適なキャンバス寸法を自動計算

5. **デバッグ機能の追加**
   - 詳細なコンソールログを追加
   - 要素の座標と描画状態を可視化
   - グリッド線と座標表示でデバッグを容易化

**修正結果:**
- ✅ 複数ラングの完全な表示が可能に
- ✅ 全ての要素（接点、コイル、接続線）が正しく描画
- ✅ アドレスラベルの明確な表示
- ✅ インタラクティブなズーム・パン機能を維持

**テストケース:**
```
ラング1: X0 (SensorA) → X1 (SensorB) → Y0 (Motor1)
ラング2: X2 (Button1) → X3 (Button2) → Y1 (Lamp1)
```

**影響範囲:**
- `frontend/src/components/LadderViewComponent.tsx` の主要な描画機能
- 座標計算、Canvasサイズ計算、要素描画ロジック
- ユーザーインターフェースの表示品質向上

## 🚧 今後の拡張予定

- [ ] オムロン、キーエンスPLC対応
- [ ] FOR/WHILEループ文のサポート
- [ ] CASE文のサポート
- [ ] 関数・ファンクションブロック対応
- [ ] GX Worksファイル出力
- [ ] ユーザー認証機能
- [ ] 変換ルールのカスタマイズ
- [ ] データベース連携（変換履歴管理）

## 🧪 テスト

### サンプルファイル
`sample-test.st` を使用して基本機能をテストできます。

```bash
# APIテスト
curl -X POST "http://localhost:8000/api/convert" \
  -H "Content-Type: application/json" \
  -d '{"source_code": "IF sensor THEN motor := TRUE; END_IF;", "plc_type": "mitsubishi"}'
```

## 📄 ライセンス

[MIT License](LICENSE)

## 🤝 貢献

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. コミット (`git commit -m 'Add some AmazingFeature'`)
4. プッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📞 お問い合わせ

プロジェクトに関する質問や問題報告は、GitHub Issuesをご利用ください。

---

**Iceplant Engineering**
自動化ソリューションのための開発ツール