import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';

export default function TransactionsTable({
  transactions,
  totalCount,
  page,
  pageCount,
  perPage,
  onPageChange,
  onPerPageChange,
  onDelete,
  onUpdate,
  filters,
  onFiltersChange,
  sortOrder,
  onSortOrderChange,
  getCategoryIcon,
  expenseCategories,
  incomeCategories,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailEditing, setDetailEditing] = useState(false);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const allCategories = [...new Set([...expenseCategories, ...incomeCategories])];

  useEffect(() => {
    if (!detailTransaction) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailTransaction]);

  const startEditing = (transaction) => {
    setEditingId(transaction.id);
    setSaveCompleted(false);
    setDraft({
      type: transaction.type,
      category: transaction.category,
      amount: String(transaction.amount ?? ''),
      merchant: transaction.merchant || '',
      purchase_time: transaction.purchase_time || '',
      memo: transaction.memo || '',
    });
    setDetailEditing(true);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
    setDetailEditing(false);
  };

  const closeDetails = () => {
    if (detailClosing) return;
    cancelEditing();
    setDetailClosing(true);
    window.setTimeout(() => {
      setDetailTransaction(null);
      setDetailClosing(false);
    }, 220);
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!editingId || !draft || saving) return;

    setSaving(true);
    try {
      const amount = Number(draft.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error('金額は0以上の数値で入力してください。');
      }
      const updatedAt = new Date().toISOString();
      await onUpdate(editingId, {
        type: draft.type,
        category: draft.category,
        amount,
        merchant: draft.merchant.trim() || null,
        purchase_time: draft.purchase_time || null,
        memo: draft.memo.trim() || null,
        created_at: updatedAt,
      });
      setDetailTransaction((current) => (
        current && current.id === editingId
          ? {
            ...current,
            ...draft,
            amount,
            merchant: draft.merchant.trim() || null,
            purchase_time: draft.purchase_time || null,
            memo: draft.memo.trim() || null,
            created_at: updatedAt,
          }
          : current
      ));
      cancelEditing();
      setSaveCompleted(true);
    } catch (error) {
      console.error('取引履歴の更新に失敗しました。', error);
      alert(error instanceof Error ? error.message : '取引履歴を更新できませんでした。時間をおいて再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const updateFilter = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const formatCreatedAt = (value) => {
    if (!value) return '記録時刻なし';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '記録時刻なし';
    return new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">最新の明細・取引履歴</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-mono">{totalCount} 件</span>
          <label className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="sr-only">1ページの表示件数</span>
            <select
              value={perPage}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
              aria-label="1ページの表示件数"
            >
              <option value={10}>10件</option>
              <option value={20}>20件</option>
              <option value={50}>50件</option>
            </select>
          </label>
          {pageCount > 1 && (
            <>
              <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="前の明細ページ">
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] text-slate-400 font-mono min-w-8 text-center">{page}/{pageCount}</span>
              <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="次の明細ページ">
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600" aria-label="種別で絞り込み">
          <option value="all">種別: すべて</option>
          <option value="expense">支出</option>
          <option value="income">収入</option>
        </select>
        <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600" aria-label="カテゴリで絞り込み">
          <option value="all">カテゴリ: すべて</option>
          {allCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="flex-1 text-[10px] text-slate-400">
            <span className="sr-only">日付で絞り込み</span>
            <input type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600" aria-label="日付で絞り込み" />
          </label>
          {filters.date && <button type="button" onClick={() => updateFilter('date', '')} className="text-xs text-slate-400 hover:text-slate-700">解除</button>}
        </div>
        <select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600" aria-label="取引履歴の並び順">
          <option value="transaction_date_desc">取引日付: 新しい順</option>
          <option value="transaction_date_asc">取引日付: 古い順</option>
          <option value="created_at_desc">登録日時: 新しい順</option>
          <option value="created_at_asc">登録日時: 古い順</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold text-sm">
              <th className="pb-3 pl-2">日付</th>
              <th className="pb-3">種別</th>
              <th className="pb-3">店舗 / 発行元</th>
                  <th className="pb-3">カテゴリ</th>
              <th className="pb-3 text-right pr-4">金額</th>
              <th className="pb-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((transaction) => {
              return (
              <tr
                key={transaction.id}
                onClick={() => {
                  setDetailClosing(false);
                  setDetailTransaction(transaction);
                  setDetailEditing(false);
                  setSaveCompleted(false);
                }}
                className={`motion-row cursor-pointer ${transaction.type === 'income' ? 'bg-emerald-50/60 hover:bg-emerald-100/70' : 'bg-rose-50/40 hover:bg-rose-100/60'}`}
              >
                <td className="py-4 pl-2 font-mono text-slate-500">{transaction.transaction_date}</td>
                <td className="py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${transaction.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {transaction.type === 'income' ? '収入' : '支出'}
                  </span>
                </td>
                <td className="py-4 font-medium text-slate-900">{transaction.merchant || '-'}</td>
                <td className="py-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {getCategoryIcon(transaction.category)}
                    <span>{transaction.category}</span>
                  </div>
                </td>
                <td className={`py-4 text-right pr-4 font-mono font-bold text-sm ${transaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {transaction.type === 'income' ? '+' : '-'}¥{Number(transaction.amount).toLocaleString()}
                </td>
                <td className="py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(transaction.id); }} className="text-slate-300 hover:text-rose-600 transition-colors" aria-label={`${transaction.merchant || 'この取引'}を削除`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="前の明細ページ">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-slate-500 font-mono">{page} / {pageCount}</span>
          <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="次の明細ページ">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {detailTransaction && (
        <div
          className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="取引詳細"
          onClick={closeDetails}
        >
          <div
            className={`motion-panel ${detailClosing ? 'motion-panel-closing' : ''} hide-scrollbar max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">取引の詳細</h3>
              <div className="flex items-center gap-3">
                {!detailEditing && (
                  <button type="button" onClick={() => startEditing(detailTransaction)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900" aria-label="取引を編集">
                    <Pencil size={15} />編集
                  </button>
                )}
                <button type="button" onClick={closeDetails} disabled={detailClosing} className="text-slate-400 hover:text-slate-700 disabled:opacity-50" aria-label="詳細を閉じる"><X size={18} /></button>
              </div>
            </div>
            {detailEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 block text-slate-500">店舗 / 発行元</label>
                  <input type="text" value={draft.merchant} onChange={(event) => updateDraft('merchant', event.target.value)} maxLength={200} placeholder="店舗、会社名など" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-slate-500">金額 (円)</label>
                  <input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => updateDraft('amount', event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-slate-500">種別</label>
                  <select value={draft.type} onChange={(event) => {
                    const type = event.target.value;
                    updateDraft('type', type);
                    updateDraft('category', type === 'income' ? incomeCategories[0] : expenseCategories[0]);
                  }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <option value="expense">支出</option>
                    <option value="income">収入</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-500">カテゴリ</label>
                  <select value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {(draft.type === 'income' ? incomeCategories : expenseCategories).map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-500">購入時刻</label>
                  <input type="time" value={draft.purchase_time} onChange={(event) => updateDraft('purchase_time', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-slate-500">メモ</label>
                  <textarea value={draft.memo} onChange={(event) => updateDraft('memo', event.target.value)} maxLength={500} rows={4} placeholder="メモを入力" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={cancelEditing} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 font-medium disabled:opacity-40">キャンセル</button>
                  <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-40">
                    <Check size={15} />保存
                  </button>
                </div>
              </div>
            ) : (
            <>
            {saveCompleted && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700" role="status">
                <Check size={16} />編集が完了しました。
              </div>
            )}
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-400">店舗 / 発行元</dt><dd className="font-medium text-slate-900">{detailTransaction.merchant || '-'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">金額</dt><dd className={`font-mono font-bold ${detailTransaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{detailTransaction.type === 'income' ? '+' : '-'}¥{Number(detailTransaction.amount).toLocaleString()}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">種別</dt><dd className="font-medium text-slate-900">{detailTransaction.type === 'income' ? '収入' : '支出'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">カテゴリ</dt><dd className="font-medium text-slate-900">{detailTransaction.category}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">日付</dt><dd className="font-medium text-slate-900">{detailTransaction.transaction_date}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">購入時刻</dt><dd className="font-medium text-slate-900">{detailTransaction.purchase_time || '記載なし'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">記録時刻</dt><dd className="font-medium text-slate-900">{formatCreatedAt(detailTransaction.created_at)}</dd></div>
              <div className="border-t border-slate-100 pt-3"><dt className="mb-1 text-slate-400">メモ</dt><dd className="whitespace-pre-wrap text-slate-700">{detailTransaction.memo || 'メモはありません。'}</dd></div>
            </dl>
            </>
            )}
            {!detailEditing && <button type="button" onClick={closeDetails} disabled={detailClosing} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">閉じる</button>}
          </div>
        </div>
      )}
    </div>
  );
}
