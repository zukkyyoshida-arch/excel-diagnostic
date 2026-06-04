export const dynamic = 'force-dynamic';

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DiagnosisResult } from '@/lib/types';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const resultParam = searchParams.get('result');
    if (resultParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(resultParam));
        setResult(decoded);
      } catch (error) {
        console.error('Failed to decode result:', error);
      }
    }
    setIsLoading(false);
  }, [searchParams]);

  const copyToken = async () => {
    if (result?.client_token) {
      await navigator.clipboard.writeText(result.client_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-navy-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-navy-900 mb-4">結果が見つかりません</h1>
          <p className="text-navy-700 mb-6">診断結果が取得できませんでした。</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-navy-600 hover:bg-navy-700 text-white font-medium rounded-lg transition-colors"
          >
            診断画面に戻る
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = result.tier === 'できます';
  const bannerBgColor = isSuccess ? 'bg-green-50' : 'bg-amber-50';
  const bannerBorderColor = isSuccess ? 'border-green-200' : 'border-amber-200';
  const bannerTitleColor = isSuccess ? 'text-green-700' : 'text-amber-700';
  const ctaButtonColor = isSuccess
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-amber-600 hover:bg-amber-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-navy-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 判定バナー */}
        <div className={`${bannerBgColor} border-2 ${bannerBorderColor} rounded-lg p-8 mb-8`}>
          <h1 className={`text-3xl font-bold ${bannerTitleColor} mb-2`}>
            {isSuccess ? '✓ アプリ化できます' : '📋 じっくり相談が必要です'}
          </h1>
          <p className={`text-lg ${isSuccess ? 'text-green-600' : 'text-amber-600'}`}>
            {isSuccess
              ? 'スマートフォン対応やリアルタイム共有で、業務効率化が実現可能です'
              : '複雑な構造のため、専門スタッフによるカスタム対応をお勧めします'}
          </p>
        </div>

        {/* 読み取った内容 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">読み取った内容</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 mb-6">
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-sm text-navy-600 font-medium mb-1">ファイル名</p>
              <p className="text-navy-900 font-semibold truncate">{result.file_name}</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-sm text-navy-600 font-medium mb-1">用途</p>
              <p className="text-navy-900 font-semibold">{result.purpose}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-900">{result.summary}</p>
          </div>
        </div>

        {/* ファイル分析結果 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">ファイル分析結果</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-navy-50 rounded-lg p-4 text-center">
              <p className="text-sm text-navy-600 font-medium mb-2">シート数</p>
              <p className="text-2xl font-bold text-navy-900">{result.signals.sheet_count}</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4 text-center">
              <p className="text-sm text-navy-600 font-medium mb-2">推定データ件数</p>
              <p className="text-2xl font-bold text-navy-900">{result.signals.row_count_est}</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4 text-center">
              <p className="text-sm text-navy-600 font-medium mb-2">マクロ</p>
              <p className="text-2xl font-bold text-navy-900">
                {result.signals.has_macros ? '有' : '無'}
              </p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4 text-center">
              <p className="text-sm text-navy-600 font-medium mb-2">数式複雑度</p>
              <p className="text-2xl font-bold text-navy-900">
                {result.signals.formula_complexity === 'basic' ? '基本' : '複雑'}
              </p>
            </div>
          </div>
        </div>

        {/* こう変わります */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">こう変わります</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div>
              <h3 className="text-lg font-semibold text-navy-900 mb-4">📌 現在</h3>
              <div className="space-y-3">
                {result.before.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-red-500 font-bold mt-1">✕</span>
                    <p className="text-navy-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div>
              <h3 className="text-lg font-semibold text-navy-900 mb-4">✨ アプリ化後</h3>
              <div className="space-y-3">
                {result.after.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-green-500 font-bold mt-1">✓</span>
                    <p className="text-navy-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA ボタン */}
        <div className="text-center mb-8">
          <a
            href="mailto:support@example.com?subject=Excel診断ツール：相談希望"
            className={`inline-block px-8 py-4 ${ctaButtonColor} text-white font-bold rounded-lg transition-colors text-lg`}
          >
            メールで詳しく相談する
          </a>
        </div>

        {/* 注記 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-700">
            <strong>⚠️ ご注意：</strong> この診断は Excel の構造から自動判定した概要です。実際の要件・カスタマイズ範囲は面談で確定いたします。
          </p>
        </div>

        {/* 診断トークン */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-navy-600 font-medium mb-1">診断トークン</p>
              <p className="text-sm font-mono text-navy-900">{result.client_token}</p>
              <p className="text-xs text-navy-600 mt-2">
                相談時にこのトークンをお知らせいただくと、診断内容をスムーズに引き継ぎできます。
              </p>
            </div>
            <button
              onClick={copyToken}
              className="px-4 py-2 bg-navy-100 hover:bg-navy-200 text-navy-600 font-medium rounded transition-colors flex-shrink-0"
            >
              {copied ? '✓ コピー済み' : 'コピー'}
            </button>
          </div>
        </div>

        {/* プライバシー */}
        <p className="text-center text-xs text-navy-600 mt-8">
          このファイルは診断後に削除されています。
        </p>
      </div>
    </div>
  );
}
