// 投資対効果計算用定数
export const INITIAL_COST = 200000; // 初期費用（円）
export const MONTHLY_COST = 15000; // 月額（円）
export const REDUCTION_RATE = 0.9; // 削減率（90%）
export const DEFAULT_HOURLY_VALUE = 2000; // 作業1時間あたりの価値（円）

// 赤フラグ判定基準
export const RED_FLAGS = {
  MERGED_CELLS_THRESHOLD: 10, // セル結合数の閾値
  SHEET_COUNT_THRESHOLD: 4, // シート数の閾値
  NESTED_IF_DEPTH_THRESHOLD: 3, // IF のネスト深度の閾値
};

// Claude API 設定
export const SYSTEM_PROMPT = `あなたは中小企業のExcelを分析する専門家です。渡されたExcelの見出しとサンプルから、
このExcelが何を管理するためのものかを判定し、業務アプリ化した場合の改善点を、
中小企業の担当者にも伝わる平易な日本語で記述してください。
技術用語は使わないこと。前置きや説明は不要、以下のJSONのみを返すこと:

{
  "purpose": "このExcelの用途を短く（例: 在庫管理表）",
  "summary": "用途を一文で（例: 商品の入出庫を管理する表）",
  "before": ["現状の不便を顧客の言葉で1〜2個（例: PCでしか開けない）"],
  "after": ["アプリ化後の良さを顧客の言葉で1〜2個（例: スマホで入力できる）"]
}`;
