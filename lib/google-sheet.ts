import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { DiagnosisResult } from './types';

export async function appendDiagnosisResult(result: DiagnosisResult): Promise<void> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountEmail || !privateKey || !sheetId) {
    console.error('Google service account credentials are missing');
    return;
  }

  try {
    const doc = new GoogleSpreadsheet(sheetId);

    // JWT 認証
    await doc.useServiceAccountAuth({
      client_email: serviceAccountEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    });

    // ドキュメント情報を読み込み
    await doc.loadInfo();

    // 最初のシートを取得
    const sheet = doc.sheetsByIndex[0];

    // 行を追加
    await sheet.addRows([
      {
        timestamp: new Date().toISOString(),
        client_token: result.client_token,
        file_name: result.file_name,
        tier: result.tier,
        purpose: result.purpose,
        summary: result.summary,
        sheet_count: result.signals.sheet_count,
        row_count_est: result.signals.row_count_est,
        has_macros: result.signals.has_macros ? 'true' : 'false',
        monthly_hours_input: result.monthly_hours_input,
        saved_hours: result.saved_hours,
        monthly_saving_yen: result.monthly_saving_yen,
        payback_months: result.payback_months || '—',
        status: '診断済み（未対応）',
        notes: '',
      },
    ]);

    console.log('Diagnosis result appended to Google Sheet');
  } catch (error) {
    console.error('Failed to append to Google Sheet:', error);
    throw error;
  }
}
