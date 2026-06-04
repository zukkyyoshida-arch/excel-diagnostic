'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DiagnosisResult } from '@/lib/types';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // URL パラメータから結果を取得（JSON エンコード）
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
  const bannerTextColor = isSuccess ? 'text-green-900' : 'text-amber-900';
  const bannerTitleColor = isSuccess ? 'text-green-700' : 'text-amber-700';
  const ctaButtonColor = isSuccess
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-amber-600 hover:bg-amber-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-navy-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 判定バナー */}
        <div
          className={`${bannerBgColor} border-2 ${bannerBorderColor} rounded-lg p-8 mb-8`}
        >
          <h1
            className={`text-3xl font-bold ${bannerTitleColor} mb-2`}
          >
            {isSuccess ? '✓ アプリ化できます' : '📋 じっくり相談が必要です'}
          </h1>
          <p className={`text-lg ${bannerTextColor}`}>
            {isSuccess
              ? '標準プランで対応可能です（概算）'
              : '上位プランでの個別対応になります'}
          </p>
        </div>

        {/* 読み取った内容 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">読み取った内容</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-sm text-navy-600 font-medium mb-1">ファイル名</p>
              <p className="text-navy-900 font-semibold truncate">{result.file_name}</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-sm text-navy-600 font-medium mb-1">シート数</p>
              <p className="text-navy-900 font-semibold">{result.signals.sheet_count} 枚</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-sm text-navy-600 font-medium mb-1">推定データ件数</p>
              <p className="text-navy-900 font-semibold">{result.signals.row_count_est} 件</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-sm text-navy-600 font-medium mb-1">用途</p>
              <p className="text-navy-900 font-semibold truncate">{result.purpose}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900">{result.summary}</p>
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
                    <span className="text-red-500 mt-1">✕</span>
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
                    <span className="text-green-500 mt-1">✓</span>
                    <p className="text-navy-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 投資対効果 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">
            {isSuccess ? '投資対効果' : '概算（詳しくはお見積り）'}
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-600 font-medium mb-2">初期費用</p>
              <p className="text-2xl font-bold text-blue-900">200,000円</p>
            </div>

            <div className="bg-gradient-to-br from-navy-50 to-navy-100 border border-navy-300 rounded-lg p-6">
              <p className="text-sm text-navy-600 font-medium mb-2">月額</p>
              <p className="text-2xl font-bold text-navy-900">15,000円</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-green-600 font-medium mb-2">削減できる手間</p>
              <p className="text-2xl font-bold text-green-900">
                {result.saved_hours}
                <span className="text-sm">時間/月</span>
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
              <p className="text-sm text-purple-600 font-medium mb-2">投資回収</p>
              <p className="text-2xl font-bold text-purple-900">
                {result.payback_months ? `${result.payback_months}ヶ月` : '—'}
              </p>
            </div>
          </div>

          <p className="text-xs text-navy-600 mt-4">
            ※ 上記は概算です。実際の削減効果はプロジェクト内容により異なります。
          </p>
        </div>

        {/* CTA ボタン */}
        <div className="text-center mb-8">
          <button
            onClick={() => {
              // CTA クリック時の処理（後で実装）
              window.location.href = `mailto:support@example.com?subject=Excel診断結果（${result.file_name}）&body=トークン: ${result.client_token}`;
            }}
            className={`px-8 py-4 ${ctaButtonColor} text-white font-bold rounded-lg transition-colors text-lg`}
          >
            {isSuccess ? '無料で詳しく相談する' : '専門スタッフに相談する'}
          </button>
        </div>

        {/* プライバシー */}
        <div className="text-center text-sm text-navy-600">
          <p>このファイルは診断後に削除されています。</p>
          <p className="mt-1">
            診断トークン: <code className="text-xs bg-navy-50 px-2 py-1 rounded">{result.client_token}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
