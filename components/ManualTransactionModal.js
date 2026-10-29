import { X } from 'lucide-react';
import { useState } from 'react';

export default function ManualTransactionModal({
  form,
  expenseCategories,
  incomeCategories,
  onChange,
  onSubmit,
  onClose,
}) {
  const [closing, setClosing] = useState(false);
  const closeModal = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 220);
  };
  const update = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="motion-backdrop fixed inset-0 overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 z-50" onClick={closeModal}>
      <div className="min-h-full flex items-center justify-center">
        <div className={`motion-panel ${closing ? 'motion-panel-closing' : ''} bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-4`} onClick={(event) => event.stopPropagation()}>
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">手動でデータを追加</h3>
            <button type="button" onClick={closeModal} disabled={closing} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" aria-label="手動入力を閉じる"><X size={18} /></button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">種別</label>
              <div className="grid grid-cols-2 gap-2">
                {['expense', 'income'].map((type) => (
                  <button key={type} type="button" onClick={() => onChange({ ...form, type, category: type === 'expense' ? expenseCategories[0] : incomeCategories[0] })} className={`py-2 rounded-xl border text-center font-semibold transition-all ${form.type === type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}>
                    {type === 'expense' ? '支出' : '収入'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">金額 (円)</label>
              <input type="number" required value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="1200" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">店舗 / 発行元</label>
              <input type="text" value={form.merchant} onChange={(event) => update('merchant', event.target.value)} placeholder="コンビニ、スーパーなど" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">カテゴリ</label>
              <select value={form.category} onChange={(event) => update('category', event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900">
                {(form.type === 'expense' ? expenseCategories : incomeCategories).map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">日付</label>
              <input type="date" value={form.transaction_date} onChange={(event) => update('transaction_date', event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900" />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={closing} className="px-4 py-2 border border-slate-200 font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50">キャンセル</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800">追加する</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
