import { read, WorkBook, Sheet } from 'xlsx';
import { DiagnosisSignals } from './types';
import { RED_FLAGS } from './constants';

export async function analyzeExcel(buffer: Buffer): Promise<DiagnosisSignals> {
  const workbook = read(buffer, { defval: '' });

  const sheetNames = workbook.SheetNames;
  const usedSheets = sheetNames.filter(
    (name) => workbook.Sheets[name] && Object.keys(workbook.Sheets[name]).length > 0
  );

  let mergedCellCount = 0;
  let totalRowCount = 0;
  let hasComplexFormulas = false;
  let hasVlookup = false;
  let maxNestedIfDepth = 0;
  let multipleTablesDetected = false;

  for (const sheetName of usedSheets) {
    const sheet = workbook.Sheets[sheetName];

    // セル結合をカウント
    if (sheet['!merges']) {
      mergedCellCount += sheet['!merges'].length;
    }

    // 行数を推定（最後のセルの行番号）
    const range = sheet['!ref'];
    if (range) {
      const parts = range.split(':');
      const lastCell = parts[1];
      const rowMatch = lastCell.match(/\d+$/);
      if (rowMatch) {
        totalRowCount = Math.max(totalRowCount, parseInt(rowMatch[0]));
      }
    }

    // 複雑な数式を検出
    for (const cell in sheet) {
      if (cell === '!merges' || cell === '!ref' || cell === '!cols' || cell === '!rows') {
        continue;
      }

      const cellObj = sheet[cell];
      if (cellObj && typeof cellObj === 'object' && 'f' in cellObj) {
        const formula = cellObj.f as string;

        // VLOOKUP/INDEX/MATCH の使用
        if (formula.match(/VLOOKUP|INDEX|MATCH/i)) {
          hasVlookup = true;
        }

        // 配列数式（{...}）
        if (formula.includes('{')) {
          hasComplexFormulas = true;
        }

        // IF のネスト深度
        const ifDepth = calculateIfNestDepth(formula);
        maxNestedIfDepth = Math.max(maxNestedIfDepth, ifDepth);
      }
    }
  }

  // 複数の表の兆候（空行の検出など）
  if (usedSheets.length > 0) {
    const firstSheet = workbook.Sheets[usedSheets[0]];
    multipleTablesDetected = detectMultipleTables(firstSheet);
  }

  const formulaComplexity =
    maxNestedIfDepth >= RED_FLAGS.NESTED_IF_DEPTH_THRESHOLD ||
    hasComplexFormulas ||
    hasVlookup
      ? 'complex'
      : 'basic';

  return {
    sheet_count: usedSheets.length,
    row_count_est: Math.max(totalRowCount - 1, 0), // ヘッダー行を除外
    has_macros: hasMacros(workbook),
    merged_cell_count: mergedCellCount,
    formula_complexity: formulaComplexity,
    multiple_tables_detected: multipleTablesDetected,
    high_vlookup_usage: hasVlookup,
    nested_if_depth: maxNestedIfDepth,
  };
}

function hasMacros(workbook: WorkBook): boolean {
  // .xlsm ファイル形式のチェック
  // WorkBook に vbaProject プロパティがあればマクロ有り
  return !!(workbook as any).vbaProject;
}

function calculateIfNestDepth(formula: string): number {
  let depth = 0;
  let maxDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];

    // 文字列内の場合はスキップ
    if ((char === '"' || char === "'") && (i === 0 || formula[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (inString) continue;

    // IF( の開き
    if (
      formula.substring(i, i + 3).toUpperCase() === 'IF(' &&
      (i === 0 || !formula[i - 1].match(/[A-Z0-9]/i))
    ) {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      i += 2;
    }
    // ) のとじ
    else if (char === ')') {
      if (depth > 0) depth--;
    }
  }

  return maxDepth;
}

function detectMultipleTables(sheet: Sheet): boolean {
  // シート内に複数の表が存在する兆候を検出
  // 簡易的に：空の行が複数存在するかをチェック
  let emptyRowCount = 0;
  let dataRowCount = 0;

  const range = sheet['!ref'];
  if (!range) return false;

  const parts = range.split(':');
  const lastCell = parts[1];
  const rowMatch = lastCell.match(/\d+$/);
  if (!rowMatch) return false;

  const maxRow = parseInt(rowMatch[0]);

  for (let row = 1; row <= maxRow; row++) {
    let isRowEmpty = true;
    for (const cell in sheet) {
      if (cell === '!merges' || cell === '!ref' || cell === '!cols' || cell === '!rows') {
        continue;
      }

      const cellRow = parseInt(cell.match(/\d+$/)?.[0] || '0');
      if (cellRow === row) {
        const cellObj = sheet[cell];
        if (cellObj && cellObj.v !== undefined && cellObj.v !== null && cellObj.v !== '') {
          isRowEmpty = false;
          break;
        }
      }
    }

    if (isRowEmpty) {
      emptyRowCount++;
    } else {
      dataRowCount++;
    }
  }

  // データ行と空行の比率から複数表を判定
  return emptyRowCount > 2 && dataRowCount > 5 && emptyRowCount / dataRowCount > 0.2;
}

export function extractSheetSamples(
  workbook: WorkBook,
  samplesPerSheet: number = 5
): {
  sheets: Array<{ name: string; headers: string[]; samples: string[][] }>;
} {
  const sheetNames = workbook.SheetNames;
  const sheets = [];

  for (const sheetName of sheetNames.slice(0, 3)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || Object.keys(sheet).length === 0) continue;

    const range = sheet['!ref'];
    if (!range) continue;

    const parts = range.split(':');
    const lastCell = parts[1];
    const colMatch = lastCell.match(/^[A-Z]+/);
    const rowMatch = lastCell.match(/\d+$/);

    if (!colMatch || !rowMatch) continue;

    const headers: string[] = [];
    const samples: string[][] = [];

    // ヘッダー行（1行目）を抽出
    for (let col = 0; col < 26; col++) {
      const cellKey = String.fromCharCode(65 + col) + '1';
      const cell = sheet[cellKey];
      if (cell && cell.v !== undefined) {
        headers.push(String(cell.v));
      } else {
        break;
      }
    }

    // サンプル行（2〜N行）を抽出
    const maxRow = Math.min(parseInt(rowMatch[0]), samplesPerSheet + 1);
    for (let row = 2; row <= maxRow; row++) {
      const sampleRow: string[] = [];
      for (let col = 0; col < headers.length; col++) {
        const cellKey = String.fromCharCode(65 + col) + row;
        const cell = sheet[cellKey];
        sampleRow.push(cell && cell.v !== undefined ? String(cell.v) : '');
      }
      if (sampleRow.some((v) => v !== '')) {
        samples.push(sampleRow);
      }
    }

    if (headers.length > 0) {
      sheets.push({ name: sheetName, headers, samples });
    }
  }

  return { sheets };
}
