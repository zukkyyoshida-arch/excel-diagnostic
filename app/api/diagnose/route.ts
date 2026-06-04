import { NextRequest, NextResponse } from 'next/server';
import { analyzeExcel, extractSheetSamples } from '@/lib/excel-analyzer';
import { judgeTier, calculateROI, generateClientToken } from '@/lib/diagnosis-engine';
import { callHuggingFaceAPI } from '@/lib/hugging-face';
import { appendDiagnosisResult } from '@/lib/google-sheet';
import { DiagnosisResponse } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse<DiagnosisResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const monthlyHoursStr = formData.get('monthlyHours') as string | null;

    // バリデーション
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    if (!monthlyHoursStr) {
      return NextResponse.json(
        { success: false, error: '月の作業時間が入力されていません' },
        { status: 400 }
      );
    }

    const monthlyHours = parseFloat(monthlyHoursStr);
    if (isNaN(monthlyHours) || monthlyHours <= 0) {
      return NextResponse.json(
        { success: false, error: '月の作業時間は正の数値で入力してください' },
        { status: 400 }
      );
    }

    // ファイルを Buffer に変換
    const buffer = Buffer.from(await file.arrayBuffer());

    // Excel 解析
    const signals = await analyzeExcel(buffer);

    // 判定（緑/赤）
    const tier = judgeTier(signals);

    // シートサンプルを抽出
    const { sheets } = extractSheetSamples(
      require('xlsx').read(buffer, { defval: '' }),
      3
    );

    // サンプルテキストを生成
    const sheetSamplesText = sheets
      .map((sheet) => {
        const headerLine = sheet.headers.join(' | ');
        const sampleLines = sheet.samples.slice(0, 3).map((row) => row.join(' | '));
        return `[シート: ${sheet.name}]\n${headerLine}\n${sampleLines.join('\n')}`;
      })
      .join('\n\n');

    // Hugging Face API で AI 生成
    const huggingFaceKey = process.env.HUGGING_FACE_API_KEY;
    const huggingFaceModel = process.env.HUGGING_FACE_MODEL;

    if (!huggingFaceKey || !huggingFaceModel) {
      return NextResponse.json(
        { success: false, error: 'Hugging Face 設定が不足しています' },
        { status: 500 }
      );
    }

    const aiContent = await callHuggingFaceAPI(sheetSamplesText, huggingFaceKey, huggingFaceModel);

    // ROI 計算
    const hourlyValue =
      parseInt(process.env.DIAGNOSE_HOURLY_VALUE || '2000') || 2000;
    const roi = calculateROI(monthlyHours, hourlyValue);

    // クライアントトークン生成
    const clientToken = generateClientToken();

    // 診断結果オブジェクト
    const diagnosisResult = {
      tier,
      file_name: file.name,
      purpose: aiContent.purpose,
      summary: aiContent.summary,
      before: aiContent.before,
      after: aiContent.after,
      signals,
      monthly_hours_input: monthlyHours,
      saved_hours: roi.saved_hours,
      monthly_saving_yen: roi.monthly_saving_yen,
      payback_months: roi.payback_months,
      client_token: clientToken,
    };

    // Google スプレッドシートに追記
    try {
      await appendDiagnosisResult(diagnosisResult);
    } catch (sheetError) {
      console.warn('Failed to append to Google Sheet (non-fatal):', sheetError);
      // スプレッドシート書き込み失敗でもレスポンスは返す
    }

    // メモリに残ったファイルバッファをクリア
    buffer.fill(0);

    return NextResponse.json(
      {
        success: true,
        result: diagnosisResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Diagnosis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
