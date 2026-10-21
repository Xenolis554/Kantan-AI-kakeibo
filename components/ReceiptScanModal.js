import { Loader2, Sparkles, Upload, X } from 'lucide-react';

export default function ReceiptScanModal({
  previewUrl,
  scanLoading,
  scanStatus,
  scanError,
  selectedFile,
  onFileChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 z-50">
      <div className="min-h-full flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} /> AIスキャン自動解析
              </h3>
              <p className="text-xs text-slate-500 mt-1">レシート、公共料金、給料明細の画像をアップロード</p>
            </div>
            <button type="button" onClick={onClose} disabled={scanLoading} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" aria-label="AIスキャンを閉じる">
              <X size={18} />
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-slate-400 transition-all bg-slate-50">
            <input type="file" accept="image/*" onChange={onFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="text-slate-400 mb-2" size={24} />
              <span className="text-xs font-medium text-slate-700">画像ファイルを選択</span>
              <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP 対応</span>
            </label>
          </div>

          {previewUrl && (
            <div className="relative h-40 w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <img src={previewUrl} alt="選択したレシートのプレビュー" className="object-contain w-full h-full" />
            </div>
          )}

          {scanLoading && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4" role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <Loader2 className="shrink-0 animate-spin text-sky-600" size={22} />
                <div>
                  <p className="text-sm font-semibold text-sky-900">{scanStatus || '解析しています...'}</p>
                  <p className="text-[11px] text-sky-700 mt-1">画面を閉じずにお待ちください（最大30秒）</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-sky-500" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={scanLoading} className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50">キャンセル</button>
            <button type="button" onClick={onSubmit} disabled={scanLoading || !selectedFile} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5">
              {scanLoading && <Loader2 size={14} className="animate-spin" />}
              {scanLoading ? '解析中...' : '解析して保存'}
            </button>
          </div>
          {scanError && <p role="alert" className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">{scanError}</p>}
        </div>
      </div>
    </div>
  );
}
