import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function PeriodNavigator({
  selectedMonth,
  selectedMonthLabel,
  availableYears,
  selectedMonthTransactionCount,
  totalIncome,
  totalExpense,
  onMoveMonth,
  onYearChange,
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMoveMonth(-1)}
          aria-label="前月を表示"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">表示期間</div>
          <div className="flex items-center justify-center gap-2">
            <select
              value={selectedMonth.slice(0, 4)}
              onChange={(event) => onYearChange(event.target.value)}
              aria-label="表示年"
              className="bg-transparent text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 rounded-lg"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            <span className="text-xl font-bold text-slate-900">{selectedMonth.slice(5)}月</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {selectedMonthLabel}の登録件数:{' '}
            <span className="font-bold text-slate-700">{selectedMonthTransactionCount}件</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onMoveMonth(1)}
          aria-label="翌月を表示"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="h-32 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[{ label: selectedMonthLabel, income: totalIncome, expense: totalExpense }]}
            barCategoryGap="35%"
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value, name) => [`¥${Number(value).toLocaleString()}`, name === 'income' ? '収入' : '支出']}
              cursor={false}
              allowEscapeViewBox={{ x: true, y: true }}
              position={{ y: -8 }}
              wrapperStyle={{ zIndex: 10, pointerEvents: 'none' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
            />
            <Bar dataKey="income" name="収入" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={42} />
            <Bar dataKey="expense" name="支出" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />収入</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />支出</span>
      </div>
    </div>
  );
}
