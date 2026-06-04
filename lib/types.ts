export type DiagnosisTier = 'できます' | '要相談';

export interface DiagnosisSignals {
  sheet_count: number;
  row_count_est: number;
  has_macros: boolean;
  merged_cell_count: number;
  formula_complexity: 'basic' | 'complex';
  multiple_tables_detected: boolean;
  high_vlookup_usage: boolean;
  nested_if_depth: number;
}

export interface DiagnosisResult {
  tier: DiagnosisTier;
  file_name: string;
  purpose: string;
  summary: string;
  before: string[];
  after: string[];
  signals: DiagnosisSignals;
  monthly_hours_input: number;
  saved_hours: number;
  monthly_saving_yen: number;
  payback_months: number | null;
  client_token: string;
}

export interface DiagnosisRequest {
  file: File;
  monthly_hours: number;
}

export interface DiagnosisResponse {
  success: boolean;
  result?: DiagnosisResult;
  error?: string;
}

export interface AIGeneratedContent {
  purpose: string;
  summary: string;
  before: string[];
  after: string[];
}
