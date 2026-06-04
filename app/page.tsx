'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetLink, setSheetLink] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'link'>('file');

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xlsm'].includes(ext || '')) {
      setError('.xlsx または .xlsm ファイルをアップロードしてください');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは 10MB 以下にしてください');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === 'file' && !file) {
      setError('ファイルを選択してください');
      return;
    }

    if (inputMode === 'link' && !sheetLink.trim()) {
      setError('スプレッドシートのリンクを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    if (inputMode === 'file' && file) {
      formData.append('file', file);
    } else if (inputMode === 'link') {
      formData.append('sheetLink', sheetLink);
    }
    formData.append('monthlyHours', '0');

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '診断に失敗しました');
      }

      const result = await response.json();
      // 結果画面へリダイレクト
      const resultParam = encodeURIComponent(JSON.stringify(result.result));
      window.location.href = `/results?result=${resultParam}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-navy-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-navy-900 mb-3">
            Excel 診断ツール
          </h1>
          <p className="text-lg text-navy-700">
            Excelをアップロードするとビジネスアプリ化の可能性を
            <br />
            その場で診断します
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ファイル / リンク選択 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">
              1. Excel ファイルまたは Google スプレッドシートを選択
            </h2>

            {/* モード切り替えボタン */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setInputMode('file');
                  setSheetLink('');
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  inputMode === 'file'
                    ? 'bg-navy-600 text-white'
                    : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                }`}
              >
                📁 ファイルをアップロード
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('link');
                  setFile(null);
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  inputMode === 'link'
                    ? 'bg-navy-600 text-white'
                    : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                }`}
              >
                🔗 リンクを共有
              </button>
            </div>

            {/* ファイルアップロードモード */}
            {inputMode === 'file' && (
              <>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-navy-500 bg-navy-50'
                      : 'border-navy-300 bg-gray-50 hover:border-navy-400'
                  }`}
                >
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-navy-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <p className="text-navy-900 font-medium mb-2">
                    ファイルをドラッグしてドロップするか、
                  </p>

                  <label className="inline-block cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xlsm"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-block px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white font-medium rounded transition-colors">
                      ファイルを選択
                    </span>
                  </label>

                  {file && (
                    <p className="mt-4 text-sm text-navy-700 font-medium">
                      ✓ {file.name}
                    </p>
                  )}
                </div>

                <p className="text-xs text-navy-600 mt-3">
                  対応形式: .xlsx, .xlsm（10MB以下）
                </p>
              </>
            )}

            {/* スプレッドシートリンクモード */}
            {inputMode === 'link' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-navy-700 font-medium mb-2">
                    Google スプレッドシートのリンク
                  </label>
                  <input
                    type="url"
                    value={sheetLink}
                    onChange={(e) => setSheetLink(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-3 border-2 border-navy-300 rounded-lg focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                  />
                </div>

                <p className="text-xs text-navy-600">
                  ✓ 共有リンク（閲覧可能）と エクスポートリンク の両形式に対応しています
                </p>
              </>
            )}
          </div>


          {/* 注意事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-blue-900">
                  <strong>プライバシーについて:</strong> アップロードされたファイルは診断後に自動で削除されます。
                  本サーバーに保存されることはありません。
                </p>
              </div>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={
              isLoading ||
              (inputMode === 'file' && !file) ||
              (inputMode === 'link' && !sheetLink.trim())
            }
            className={`w-full py-4 font-bold rounded-lg transition-colors text-lg font-semibold border-2 ${
              isLoading ||
              (inputMode === 'file' && !file) ||
              (inputMode === 'link' && !sheetLink.trim())
                ? 'bg-stone-400 text-stone-700 border-stone-500 cursor-not-allowed'
                : 'bg-navy-600 hover:bg-navy-700 text-white border-navy-600 cursor-pointer'
            }`}
          >
            {isLoading ? '診断中...' : '診断を開始'}
          </button>
        </form>

        {/* フッター */}
        <p className="text-center text-sm text-navy-600 mt-8">
          このツールについてのご質問は{' '}
          <span className="font-medium">support@example.com</span> までお気軽にどうぞ
        </p>
      </div>
    </div>
  );
}
