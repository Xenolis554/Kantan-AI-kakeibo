import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export default function TransactionsTable({
  transactions,
  totalCount,
  page,
  pageCount,
  perPage,
  onPageChange,
  onPerPageChange,
  onDelete,
  getCategoryIcon,
}) {
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
            {transactions.map((transaction) => (
              <tr key={transaction.id} className={`transition-colors ${transaction.type === 'income' ? 'bg-emerald-50/60 hover:bg-emerald-100/70' : 'bg-rose-50/40 hover:bg-rose-100/60'}`}>
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
                  <button type="button" onClick={() => onDelete(transaction.id)} className="text-slate-300 hover:text-rose-600 transition-colors" aria-label={`${transaction.merchant || 'この取引'}を削除`}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
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
    </div>
  );
}
