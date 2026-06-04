import { AIGeneratedContent } from './types';
import { SYSTEM_PROMPT } from './constants';

export async function callHuggingFaceAPI(
  sheetSamples: string,
  apiKey: string,
  modelId: string
): Promise<AIGeneratedContent> {
  const userMessage = `以下は Excel ファイルの見出しとサンプルデータです:

${sheetSamples}

このExcelが何を管理するものかを判定し、業務アプリ化した場合の改善点を分析してください。`;

  const url = `https://api-inference.huggingface.co/v1/messages`;

  const payload = {
    model: modelId,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    system: SYSTEM_PROMPT,
    max_tokens: 500,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Hugging Face API error:', response.statusText);
      return getFallbackContent();
    }

    const data = await response.json();

    // 返却フォーマットをパース
    let jsonText = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      jsonText = data.choices[0].message.content;
    } else if (typeof data === 'object' && data.generated_text) {
      jsonText = data.generated_text;
    }

    // JSON フェンスを除去
    jsonText = jsonText.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();

    // JSON をパース
    const parsed = JSON.parse(jsonText);

    return {
      purpose: parsed.purpose || 'Excel管理表',
      summary: parsed.summary || '業務データを管理する表',
      before: Array.isArray(parsed.before) ? parsed.before : ['現在のプロセスに課題がある'],
      after: Array.isArray(parsed.after) ? parsed.after : ['アプリ化により効率向上'],
    };
  } catch (error) {
    console.error('Failed to call Hugging Face API:', error);
    return getFallbackContent();
  }
}

function getFallbackContent(): AIGeneratedContent {
  return {
    purpose: 'Excel管理表',
    summary: '業務データを管理するExcel表',
    before: [
      'PCでのみアクセス可能',
      '複数人での同時編集が難しい',
    ],
    after: [
      'スマートフォンからもアクセス可能',
      'リアルタイム同期でチーム間の情報共有が容易',
    ],
  };
}
