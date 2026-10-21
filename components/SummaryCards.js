import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function SummaryCards({ totalIncome, totalExpense }) {
  const balance = totalIncome - totalExpense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span className="text-sm">総支出</span>
          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500">
            <ArrowDownRight size={16} />
          </div>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-slate-900">
          ¥{totalExpense.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400 mt-1">支出合計</div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span className="text-sm">総収入</span>
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-slate-900">
          ¥{totalIncome.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400 mt-1">収入合計</div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span className="text-sm">収支バランス</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600">NET</span>
        </div>
        <div className={`text-3xl font-bold font-mono tracking-tight ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
          ¥{balance.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          収支差額 / 収入・支出比 {totalExpense > 0 ? `${(totalIncome / totalExpense).toFixed(2)}倍` : totalIncome > 0 ? '支出なし' : '—'}
        </div>
      </div>
    </div>
  );
}
