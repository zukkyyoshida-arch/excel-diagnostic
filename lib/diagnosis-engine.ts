import { DiagnosisSignals, DiagnosisTier } from './types';
import { RED_FLAGS, INITIAL_COST, MONTHLY_COST, REDUCTION_RATE } from './constants';

export function judgeTier(signals: DiagnosisSignals): DiagnosisTier {
  // 営業的に「要相談」を優先：3つ以上の条件で「要相談」、それ以外も慎重に判定

  let redFlagCount = 0;

  // 1. マクロあり
  if (signals.has_macros) {
    redFlagCount++;
  }

  // 2. セル結合が多い（5個以上）
  if (signals.merged_cell_count >= 5) {
    redFlagCount++;
  }

  // 3. シートが多い（10以上）
  if (signals.sheet_count >= 10) {
    redFlagCount++;
  }

  // 4. 複雑な数式
  if (signals.formula_complexity === 'complex') {
    redFlagCount++;
  }

  // 5. 複数の表が混在
  if (signals.multiple_tables_detected) {
    redFlagCount++;
  }

  // 6. データ件数が多い（500行以上）
  if (signals.row_count_est >= 500) {
    redFlagCount++;
  }

  // 営業判定：2つ以上で「要相談」、完全にシンプルなもののみ「できます」
  if (redFlagCount >= 2) {
    return '要相談';
  }

  // すべてクリア → 「できます」
  return 'できます';
}

export function calculateROI(monthlyHours: number, hourlyValue: number) {
  // 削減できる時間
  const savedHours = Math.round(monthlyHours * REDUCTION_RATE);

  // 削減金額（月額）
  const monthlySavingYen = Math.round(savedHours * hourlyValue);

  // 月あたりの純利益
  const netMonthly = monthlySavingYen - MONTHLY_COST;

  // 投資回収月数
  let paybackMonths: number | null = null;
  if (netMonthly > 0) {
    paybackMonths = Math.ceil(INITIAL_COST / netMonthly);
  }

  return {
    saved_hours: savedHours,
    monthly_saving_yen: monthlySavingYen,
    net_monthly: netMonthly,
    payback_months: paybackMonths,
  };
}

export function generateClientToken(): string {
  // 推測不能なランダム文字列（24文字以上）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
