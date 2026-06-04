/**
 * Google スプレッドシートのリンクから Excel ファイルをダウンロード
 */

export function extractSheetId(link: string): string | null {
  // パターン1: /d/[ID]/edit
  const match1 = link.match(/\/d\/([a-zA-Z0-9-_]+)\//);
  if (match1) {
    return match1[1];
  }

  // パターン2: /d/[ID]
  const match2 = link.match(/\/d\/([a-zA-Z0-9-_]+)(?:\?|$)/);
  if (match2) {
    return match2[1];
  }

  return null;
}

export function getExportUrl(sheetId: string): string {
  // エクスポート URL: XLSX 形式でダウンロード
  // gid=0 で最初のシートを指定（他のシートを含める場合は削除可能）
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
}

export async function downloadSheetAsExcel(link: string): Promise<Buffer> {
  const sheetId = extractSheetId(link);
  if (!sheetId) {
    throw new Error('無効な Google スプレッドシートリンク形式です');
  }

  const exportUrl = getExportUrl(sheetId);

  try {
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(
        `スプレッドシートのダウンロードに失敗しました (ステータス: ${response.status})`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`スプレッドシートへのアクセスに失敗しました: ${error.message}`);
    }
    throw error;
  }
}

export function validateSheetLink(link: string): boolean {
  if (!link.trim()) {
    return false;
  }

  try {
    const url = new URL(link);
    return url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets');
  } catch {
    return false;
  }
}
