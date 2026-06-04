import { NextRequest, NextResponse } from 'next/server';
import { analyzeExcel, extractSheetSamples } from '@/lib/excel-analyzer';
import { judgeTier, generateClientToken } from '@/lib/diagnosis-engine';
import { callHuggingFaceAPI } from '@/lib/hugging-face';
import { appendDiagnosisResult } from '@/lib/google-sheet';
import { downloadSheetAsExcel, validateSheetLink } from '@/lib/sheets-downloader';
import { DiagnosisResponse } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse<DiagnosisResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sheetLink = formData.get('sheetLink') as string | null;

    let buffer: Buffer;
    let fileName: string;

    // ファイルまたはリンクのいずれかが必須
    if (!file && !sheetLink) {
      return NextResponse.json(
        { success: false, error: 'ファイルまたはスプレッドシートリンクが必要です' },
        { status: 400 }
      );
    }

    // ファイルとリンクの両方が指定された場合はエラー
    if (file && sheetLink) {
      return NextResponse.json(
        { success: false, error: 'ファイルとリンクは同時に指定できません' },
        { status: 400 }
      );
    }

    const monthlyHours = 0;

    // ファイルまたはスプレッドシートリンクから Buffer を取得
    if (file) {
      buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
    } else if (sheetLink) {
      // バリデーション
      if (!validateSheetLink(sheetLink)) {
        return NextResponse.json(
          { success: false, error: '有効な Google スプレッドシートリンクを入力してください' },
          { status: 400 }
        );
      }

      try {
        buffer = await downloadSheetAsExcel(sheetLink);
        fileName = 'sheet.xlsx';
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'ダウンロードに失敗しました';
        return NextResponse.json(
          { success: false, error: errorMsg },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: '予期しないエラーが発生しました' },
        { status: 500 }
      );
    }

    // Excel 解析（ファイル名またはデフォルトでマクロ判定）
    const signals = await analyzeExcel(buffer, fileName);

    // 判定（緑/赤）
    const tier = judgeTier(signals);

    // シートサンプルを抽出
    const { sheets } = extractSheetSamples(
      require('xlsx').read(buffer, { cellFormula: true } as any),
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


    // クライアントトークン生成
    const clientToken = generateClientToken();

    // 診断結果オブジェクト
    const diagnosisResult = {
      tier,
      file_name: fileName,
      purpose: aiContent.purpose,
      summary: aiContent.summary,
      before: aiContent.before,
      after: aiContent.after,
      signals,
      monthly_hours_input: monthlyHours,
      saved_hours: 0,
      monthly_saving_yen: 0,
      payback_months: null,
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
