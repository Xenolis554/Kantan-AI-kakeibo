import { Calendar, MapPin, Loader2 } from 'lucide-react';

export default function WeatherBanner({ todayLabel, dailyMessage, weather, weatherInfo }) {
  const WeatherIcon = weatherInfo?.Icon;

  return (
    <section className="bg-gradient-to-r from-rose-50 via-white to-sky-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Calendar size={16} className="text-rose-400" />
            <span>今日 {todayLabel}</span>
          </div>
          <p className="mt-2 text-base font-medium text-slate-700">{dailyMessage}</p>
        </div>
        <div className="flex items-center gap-3 sm:min-w-52 sm:justify-end">
          {weather.status === 'loading' && (
            <>
              <Loader2 size={26} className="animate-spin text-sky-400" />
              <span className="text-sm text-slate-500">天気を読み込み中...</span>
            </>
          )}
          {weather.status === 'ready' && weatherInfo && WeatherIcon && (
            <>
              <WeatherIcon size={32} className={weatherInfo.color} />
              <div>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <MapPin size={13} /> 現在地の天気
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {weatherInfo.label}・{weather.temperature}℃
                </div>
              </div>
            </>
          )}
          {weather.status === 'error' && (
            <>
              <MapPin size={25} className="text-slate-400" />
              <span className="text-sm text-slate-500">位置情報を許可すると天気を表示できます</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
