import {
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
} from 'lucide-react';

const formatDateKey = (value) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { key: value, label: value };
  return { date, key: value, label: `${date.getMonth() + 1}/${date.getDate()}` };
};

const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getWeatherInfo = (weatherCode) => {
  if (weatherCode === 0) return { label: '快晴', Icon: Sun, color: 'text-amber-500' };
  if ([1, 2].includes(weatherCode)) return { label: '晴れ時々くもり', Icon: CloudSun, color: 'text-amber-500' };
  if (weatherCode === 3) return { label: 'くもり', Icon: Cloud, color: 'text-slate-500' };
  if ([45, 48].includes(weatherCode)) return { label: '霧', Icon: Cloud, color: 'text-slate-500' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return { label: '雨', Icon: CloudRain, color: 'text-sky-500' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { label: '雪', Icon: Cloud, color: 'text-sky-400' };
  if ([95, 96, 99].includes(weatherCode)) return { label: '雷雨', Icon: CloudRain, color: 'text-indigo-500' };
  return { label: '天気情報なし', Icon: Cloud, color: 'text-slate-400' };
};

export { formatDateKey, getCurrentMonth, getWeatherInfo };
