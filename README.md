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

## マイルストーン

- [x] M1: Next.js 初期化 + セットアップ
- [ ] M2: アップロード画面
- [ ] M3: `/api/diagnose` 実装（判定・AI・計算）
- [ ] M4: 結果画面（緑/赤出し分け）
- [ ] M5: Google スプレッドシート追記統合
- [ ] M6: 本番デプロイ + テスト

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

## テスト対象

- [x] きれいな1シート表 → 緑「できます」
- [ ] `.xlsm`（マクロあり） → 赤「要相談」
- [ ] セル結合だらけ表 → 赤「要相談」
- [ ] スプレッドシート追記確認
- [ ] ファイルメモリのみ処理（残存なし）
- [ ] スマホ幅レスポンシブ

---

**現在**: M1 完了（Next.js 初期化・環境設定済み）  
**次**: M2 アップロード画面実装
