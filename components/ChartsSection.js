import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ChartsSection({ categoryData, trendData, timeframe, chartColors, onTimeframeChange }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">カテゴリ別支出構成</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 10, pointerEvents: 'none' }}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {categoryData.length > 0 && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {categoryData.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-slate-600 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="font-mono font-medium text-slate-700 shrink-0">¥{category.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">収支トレンド</h2>
            <p className="text-xs text-slate-400 mt-1">選択中の月の支出推移</p>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            {[{ value: 'day', label: '日別' }, { value: 'week', label: '週別' }].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onTimeframeChange(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${timeframe === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barCategoryGap="35%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value.toLocaleString()}`} />
                <Tooltip
                  formatter={(value, name) => [`¥${Number(value).toLocaleString()}`, name === 'income' ? '収入' : '支出']}
                  labelFormatter={(label) => `${label}`}
                  cursor={false}
                  allowEscapeViewBox={{ x: true, y: true }}
                  position={{ y: -8 }}
                  wrapperStyle={{ zIndex: 10, pointerEvents: 'none' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend formatter={() => '支出'} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">取引データがありません</div>
          )}
        </div>
      </div>
    </div>
  );
}
