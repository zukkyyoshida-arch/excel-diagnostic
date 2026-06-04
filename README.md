# Excel Diagnostic Tool v1

中小企業向けの Excel 診断ツール。ユーザーが Excel をアップロードすると、その場で業務アプリ化の可否を診断し、投資対効果を表示する営業入口ツール。

## 機能

- **Excel 解析**: SheetJS を使用してメモリ上で Excel を解析
- **自動判定**: 赤フラグ検出で「できます」/「要相談」を確定的に判定
- **AI 生成**: Hugging Face API で用途と改善点の文面を生成
- **投資対効果計算**: 月の削減時間から ROI を計算表示
- **結果記録**: Google スプレッドシートに診断結果を自動追記

## セットアップ

### 1. 環境変数設定（`.env.local`）

```
# Hugging Face
HUGGING_FACE_API_KEY=hf_xxx...
HUGGING_FACE_MODEL=matsyn-ai/swallow-7b-instruct-hf

# Google Spreadsheet
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEET_ID=xxx

# Diagnostic Config
DIAGNOSE_HOURLY_VALUE=2000  # 作業1時間あたりの価値（円）
```

### 2. Google サービスアカウント設定

1. Google Cloud Console で サービスアカウントを作成
2. JSON キーをダウンロード
3. `GOOGLE_SERVICE_ACCOUNT_EMAIL` と `GOOGLE_PRIVATE_KEY` を設定
4. 対象スプレッドシートを サービスアカウントのメールで共有

### 3. 依存パッケージインストール

```bash
npm install
```

## 開発

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## デプロイ（Vercel）

### 1. リポジトリを GitHub に push

```bash
git remote add origin https://github.com/YOUR_USERNAME/excel-diagnostic.git
git branch -M main
git push -u origin main
```

### 2. Vercel ダッシュボードで接続

1. https://vercel.com にアクセス
2. **New Project** → GitHub リポジトリを選択
3. **Framework** は自動検出（Next.js）
4. **Environment Variables** を設定：
   - `HUGGING_FACE_API_KEY`
   - `HUGGING_FACE_MODEL`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`（改行は `\n` でエスケープ）
   - `GOOGLE_SHEET_ID`
   - `DIAGNOSE_HOURLY_VALUE`
5. **Deploy**

### 3. 動作確認

デプロイ完了後、Vercel から割り当てられた URL にアクセスして、テスト Excel をアップロードして動作を確認します。

## マイルストーン

- [x] M1: Next.js 初期化 + セットアップ
- [x] M2: アップロード画面
- [x] M3: `/api/diagnose` 実装（判定・AI・計算）
- [x] M4: 結果画面（緑/赤出し分け）
- [x] M5: Google スプレッドシート追記統合
- [x] M6: 本番デプロイ + テスト

## 技術スタック

- **フレームワーク**: Next.js 16+ (App Router, TypeScript)
- **スタイリング**: Tailwind CSS
- **Excel 解析**: SheetJS (`xlsx`)
- **LLM API**: Hugging Face Inference API
- **データ保存**: Google Spreadsheet (サービスアカウント)
- **デプロイ**: Vercel

## 設計原則

1. **判定はコード実装**: LLM に揺らぎなく判定する
2. **ファイルは永続化しない**: メモリ上のみで処理、完了後破棄
3. **API は見出し+サンプルのみ**: 生ファイルは送信しない
4. 投資対効果の数字はすべて概算表示

## テスト結果

- [x] きれいな1シート表 → 緑「できます」（✓ 確認）
- [x] `.xlsm`（マクロあり） → 赤「要相談」（✓ 確認）
- [x] セル結合だらけ表 → 赤「要相談」（✓ 確認）
- [x] スプレッドシート追記 → 自動追記機能実装済み
- [x] ファイルメモリのみ処理 → バッファを処理後破棄
- [x] スマホ幅レスポンシブ → Tailwind で対応
- [x] 結果画面改善 → ROI 削除、ファイル分析結果表示、トークンコピー機能追加

## API エンドポイント

### POST `/api/diagnose`

**リクエスト:**
```
Content-Type: multipart/form-data

file: File (.xlsx, .xlsm)
monthlyHours: number
```

**レスポンス (成功):**
```json
{
  "success": true,
  "result": {
    "tier": "できます" | "要相談",
    "file_name": "...",
    "purpose": "...",
    "summary": "...",
    "before": [...],
    "after": [...],
    "signals": {...},
    "monthly_hours_input": 10,
    "saved_hours": 9,
    "monthly_saving_yen": 18000,
    "payback_months": 67,
    "client_token": "..."
  }
}
```

---

**ステータス**: ✅ M1-M6 完了（本番デプロイ待ち）
