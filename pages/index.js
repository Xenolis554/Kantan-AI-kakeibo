import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import {
  Upload, Plus, LogOut, FileText, Calendar, DollarSign, Tag, Trash2,
  ArrowUpRight, ArrowDownRight, ShoppingBag, Utensils, Car, Zap,
  Briefcase, HelpCircle, Sparkles, X, CheckCircle2, ChevronRight, ChevronLeft, PiggyBank,
  MapPin, CloudSun, CloudRain, Sun, Cloud, Loader2
  , Settings, User, Mail, KeyRound, AlertTriangle
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  '食費',
  '日用品',
  '衣類・ファッション',
  '住居費',
  '水道光熱費',
  '通信費',
  '交通費',
  '医療費',
  '保険',
  '教育・学習',
  '娯楽・レジャー',
  '美容・理容',
  '交際費',
  '税金・社会保険',
  'サブスクリプション',
  '手数料',
  'その他',
];

const INCOME_CATEGORIES = ['給与・収入', '賞与', '副業収入', '臨時収入', 'その他収入'];

const formatDateKey = (value) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { key: value, label: value };
  return { date, key: value, label: `${date.getMonth() + 1}/${date.getDate()}` };
};

const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const DAILY_MESSAGES = [
  '今日も無理なく、できることから始めましょう。',
  '小さな記録が、ゆとりのある毎日につながります。',
  '今日の家計も、やさしく見える化していきましょう。',
  '頑張りすぎず、楽しみながら家計簿を続けましょう。',
  'ひとつ記録できたら、それだけで十分です。',
];

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

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [timeframe, setTimeframe] = useState('week'); // 'day' | 'week'
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const [weather, setWeather] = useState({ status: 'loading', temperature: null, code: null });
  const [dailyMessage] = useState(
    () => DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)]
  );
  
  // モーダル管理
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountAction, setAccountAction] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [accountForm, setAccountForm] = useState({
    email: '',
    displayName: '',
    password: '',
    passwordConfirmation: '',
  });
  const [scanLoading, setScanLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanError, setScanError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 手動入力フォーム state
  const [manualForm, setManualForm] = useState({
    type: 'expense',
    category: '食費',
    amount: '',
    merchant: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadWeather = async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
        );
        if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
        const data = await response.json();
        if (isActive && data.current) {
          setWeather({
            status: 'ready',
            temperature: data.current.temperature_2m,
            code: data.current.weather_code,
          });
        }
      } catch (error) {
        console.error('天気情報の取得に失敗しました。', error);
        if (isActive) setWeather({ status: 'error', temperature: null, code: null });
      }
    };

    if (!navigator.geolocation) {
      setWeather({ status: 'error', temperature: null, code: null });
      return () => {
        isActive = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      loadWeather,
      (error) => {
        console.error('現在位置を取得できませんでした。', error);
        if (isActive) setWeather({ status: 'error', temperature: null, code: null });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const isModalOpen = isScanOpen || isManualOpen || isAccountOpen;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isScanOpen, isManualOpen, isAccountOpen]);

  useEffect(() => {
    setTransactionPage(1);
  }, [selectedMonth, transactionsPerPage]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);
      setAccountForm({
        email: session.user.email || '',
        displayName: session.user.user_metadata?.display_name || '',
        password: '',
        passwordConfirmation: '',
      });
      fetchTransactions(session.user.id);
    }
  };

  const fetchTransactions = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) console.error(error);
    else setTransactions(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleAccountUpdate = async (event) => {
    event.preventDefault();
    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');

    try {
      if (
        accountAction === 'password'
        && accountForm.password !== accountForm.passwordConfirmation
      ) {
        throw new Error('新しいパスワードが一致していません。');
      }

      let updates;
      if (accountAction === 'password') {
        updates = { password: accountForm.password };
      } else if (accountAction === 'email') {
        const email = accountForm.email.trim();
        if (!email || email === user.email) {
          throw new Error('現在と異なるメールアドレスを入力してください。');
        }
        updates = { email };
      } else if (accountAction === 'displayName') {
        updates = { data: { display_name: accountForm.displayName.trim() } };
      } else {
        throw new Error('変更する項目を選択してください。');
      }

      const updateOptions = accountAction === 'email'
        ? { emailRedirectTo: `${window.location.origin}/login?emailChanged=1` }
        : undefined;
      const { data, error } = await supabase.auth.updateUser(updates, updateOptions);
      if (error) throw error;
      setUser(data.user);
      const updatedEmail = accountAction === 'email' ? accountForm.email.trim() : accountForm.email;
      setAccountForm((current) => ({
        ...current,
        email: updatedEmail,
        password: '',
        passwordConfirmation: '',
      }));
      setAccountSuccess(
        accountAction === 'email'
          ? 'メールアドレス変更の確認メールを送信しました。メール内のURLをクリックして変更を完了してください。'
          : accountAction === 'password'
            ? 'パスワードを変更しました。次回から新しいパスワードでログインしてください。'
            : 'アカウント情報を更新しました。'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      console.error('アカウント情報の更新に失敗しました。', error);
      setAccountError(
        message.toLowerCase().includes('error sending email change email')
          ? 'メールアドレス変更メールを送信できませんでした。SupabaseのAuthentication > URL Configurationに現在のサイトURLを登録し、Authentication > SMTP Settingsのメール送信設定も確認してください。'
          : message || 'アカウント情報の更新に失敗しました。'
      );
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!deletePassword) return;

    setAccountLoading(true);
    setAccountError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('ログイン状態を確認できません。');

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '退会処理に失敗しました。');

      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : '退会処理に失敗しました。');
    } finally {
      setAccountLoading(false);
      setDeletePassword('');
    }
  };

  const displayName = user?.user_metadata?.display_name;
  const accountName = `${typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : user?.email || ''} さん`;

  // AIスキャンアップロード処理
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScanError('');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleScanSubmit = async () => {
    if (!selectedFile || scanLoading) return;
    setScanLoading(true);
    setScanStatus('画像を準備しています...');
    setScanError('');
    let timeoutId;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('ログイン状態を確認できません。');

      setScanStatus('画像を圧縮しています...');
      const { imageBase64, mimeType } = await new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          image.onload = () => {
            const maxDimension = 1600;
            const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve({ imageBase64: dataUrl, mimeType: 'image/jpeg' });
          };
          image.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
          image.src = reader.result;
        };
        reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
        reader.readAsDataURL(selectedFile);
      });
      setScanStatus('AIがレシートを解析しています...');
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 30000);
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
        }),
      });
      window.clearTimeout(timeoutId);
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          response.status >= 500
            ? '画像解析サーバーで一時的なエラーが発生しました。開発サーバーを再起動して、もう一度お試しください。'
            : '画像解析サーバーから不正な応答が返されました。'
        );
      }
      if (!response.ok) throw new Error(result.error || '画像の解析に失敗しました。');

      const parsed = result.data;
      setScanStatus('解析結果を保存しています...');
      const { data: insertedTx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: parsed.type,
          category: parsed.category,
          amount: parsed.amount,
          merchant: parsed.merchant,
          transaction_date: parsed.transaction_date,
        }])
        .select()
        .single();

      if (txError) throw txError;

      if (parsed.items && parsed.items.length > 0) {
        const itemsToInsert = parsed.items.map((item) => ({
          transaction_id: insertedTx.id,
          name: item.name,
          amount: item.amount,
        }));
        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      setIsScanOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setScanStatus('');
      await fetchTransactions(user.id);
    } catch (err) {
      setScanError(
        err?.name === 'AbortError'
          ? '解析に時間がかかっているため中断しました。画像を小さくするか、時間をおいて再度お試しください。'
          : err instanceof Error
            ? err.message
            : '画像の解析に失敗しました。'
      );
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      setScanLoading(false);
      setScanStatus('');
    }
  };

  // 手動登録処理
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.amount) return;

    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          ...manualForm,
          amount: parseFloat(manualForm.amount),
        },
      ]);
      if (error) throw error;

      setIsManualOpen(false);
      setManualForm({
        type: 'expense',
        category: '食費',
        amount: '',
        merchant: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions(user.id);
    } catch (err) {
      alert('登録失敗: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このデータを削除しますか？')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchTransactions(user.id);
  };

  const selectedMonthTransactions = transactions.filter((transaction) =>
    typeof transaction.transaction_date === 'string'
      && transaction.transaction_date.startsWith(selectedMonth)
  );
  const transactionPageCount = Math.max(1, Math.ceil(selectedMonthTransactions.length / transactionsPerPage));
  const visibleTransactions = selectedMonthTransactions.slice(
    (transactionPage - 1) * transactionsPerPage,
    transactionPage * transactionsPerPage
  );

  // 選択中の月の集計
  const totalIncome = selectedMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = selectedMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryData = selectedMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) existing.value += Number(t.amount);
      else acc.push({ name: t.category, value: Number(t.amount) });
      return acc;
    }, []);

  const trendData = selectedMonthTransactions.reduce((acc, transaction) => {
    const parsedDate = formatDateKey(transaction.transaction_date);
    let key = parsedDate.key;
    let label = parsedDate.label;

    if (timeframe === 'week') {
      const weekDate = new Date(parsedDate.date);
      const day = weekDate.getDay();
      weekDate.setDate(weekDate.getDate() - (day === 0 ? 6 : day - 1));
      key = weekDate.toISOString().slice(0, 10);
      label = `${weekDate.getMonth() + 1}/${weekDate.getDate()}週`;
    }

    const existing = acc.find((item) => item.key === key);
    if (existing) {
      existing[transaction.type] += Number(transaction.amount);
    } else {
      acc.push({
        key,
        label,
        income: transaction.type === 'income' ? Number(transaction.amount) : 0,
        expense: transaction.type === 'expense' ? Number(transaction.amount) : 0,
      });
    }
    return acc;
  }, []).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);

  const selectedMonthLabel = selectedMonth.replace('-', '年') + '月';
  const todayLabel = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());
  const weatherInfo = weather.code === null ? null : getWeatherInfo(weather.code);
  const WeatherIcon = weatherInfo?.Icon;
  const moveMonth = (amount) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + amount, 1);
    setSelectedMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    );
    setTransactionPage(1);
  };

  const COLORS = [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#14b8a6',
    '#6366f1',
    '#84cc16',
    '#e11d48',
  ];

  // カテゴリ用アイコンマッピング
  const getCategoryIcon = (category) => {
    switch (category) {
      case '食費': return <Utensils size={14} />;
      case '日用品': return <ShoppingBag size={14} />;
      case '交通費': return <Car size={14} />;
      case '光熱費・公共料金': return <Zap size={14} />;
      case '給与・収入': return <Briefcase size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-mono">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* サイドバー */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center shadow-sm">
              <PiggyBank size={21} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900">かんたん家計簿</h1>
              <p className="text-xs text-slate-400 font-medium">簡単に続けられる家計簿</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-6">
            <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">ACCOUNT</span>
            <span className="text-sm font-medium text-slate-700 truncate block">{accountName}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAccountError('');
              setAccountSuccess('');
              setAccountAction('');
              setDeletePassword('');
              setIsAccountOpen(true);
            }}
            className="w-full mb-4 border border-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm"
          >
            <Settings size={15} /> アカウント設定
          </button>

          <nav className="space-y-2.5">
            <button
              type="button"
              onClick={() => setIsScanOpen(true)}
              className="w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm hover:shadow text-sm"
            >
              <Sparkles size={15} /> AIスキャン登録
            </button>
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm"
            >
              <Plus size={15} /> 手動で入力
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm font-medium transition-colors pt-6 border-t border-slate-100"
        >
          <LogOut size={15} /> ログアウト
        </button>
      </aside>

      {/* メインエリア */}
      <main className="flex-1 p-6 sm:p-8 md:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
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

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="前月を表示"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">表示期間</div>
              <div className="text-xl font-bold text-slate-900">{selectedMonthLabel}</div>
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="翌月を表示"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="h-32 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ label: selectedMonthLabel, income: totalIncome, expense: totalExpense }]} barCategoryGap="35%" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value, name) => [`¥${Number(value).toLocaleString()}`, name === 'income' ? '収入' : '支出']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
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
        
        {/* サマリーカード */}
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
            <div className={`text-3xl font-bold font-mono tracking-tight ${totalIncome - totalExpense < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              ¥{(totalIncome - totalExpense).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              収支差額 / 収入・支出比 {totalExpense > 0 ? `${(totalIncome / totalExpense).toFixed(2)}倍` : totalIncome > 0 ? '支出なし' : '—'}
            </div>
          </div>
        </div>

        {/* グラフエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">カテゴリ別支出構成</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
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
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate">{category.name}</span>
                    </span>
                    <span className="font-mono font-medium text-slate-700 shrink-0">
                      ¥{category.value.toLocaleString()}
                    </span>
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
                {[
                  { value: 'day', label: '日別' },
                  { value: 'week', label: '週別' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeframe(value)}
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
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `¥${value.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value, name) => [`¥${Number(value).toLocaleString()}`, name === 'income' ? '収入' : '支出']}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      formatter={() => '支出'}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  取引データがありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 明細テーブル */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">最新の明細・取引履歴</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 font-mono">{selectedMonthTransactions.length} 件</span>
              <label className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="sr-only">1ページの表示件数</span>
                <select
                  value={transactionsPerPage}
                  onChange={(event) => setTransactionsPerPage(Number(event.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  aria-label="1ページの表示件数"
                >
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                </select>
              </label>
              {transactionPageCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setTransactionPage((page) => Math.max(1, page - 1))}
                    disabled={transactionPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="前の明細ページ"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono min-w-8 text-center">
                    {transactionPage}/{transactionPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTransactionPage((page) => Math.min(transactionPageCount, page + 1))}
                    disabled={transactionPage === transactionPageCount}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="次の明細ページ"
                  >
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
                {visibleTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      t.type === 'income'
                        ? 'bg-emerald-50/60 hover:bg-emerald-100/70'
                        : 'bg-rose-50/40 hover:bg-rose-100/60'
                    }`}
                  >
                    <td className="py-4 pl-2 font-mono text-slate-500">{t.transaction_date}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        t.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {t.type === 'income' ? '収入' : '支出'}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-slate-900">{t.merchant || '-'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        {getCategoryIcon(t.category)}
                        <span>{t.category}</span>
                      </div>
                    </td>
                    <td className={`py-4 text-right pr-4 font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {t.type === 'income' ? '+' : '-'}¥{Number(t.amount).toLocaleString()}
                    </td>
                    <td className="py-4 text-center">
                      <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactionPageCount > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setTransactionPage((page) => Math.max(1, page - 1))}
                disabled={transactionPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                aria-label="前の明細ページ"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-500 font-mono">
                {transactionPage} / {transactionPageCount}
              </span>
              <button
                type="button"
                onClick={() => setTransactionPage((page) => Math.min(transactionPageCount, page + 1))}
                disabled={transactionPage === transactionPageCount}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                aria-label="次の明細ページ"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* AIスキャンモーダル */}
      {isScanOpen && (
        <div className="fixed inset-0 overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 z-50">
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-slate-900" size={18} /> AIスキャン自動解析
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  レシート、公共料金、給料明細の画像をアップロード
                </p>
              </div>
              <button onClick={() => setIsScanOpen(false)} disabled={scanLoading} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                <X size={18} />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-slate-400 transition-all bg-slate-50">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="text-slate-400 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-700">画像ファイルを選択</span>
                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP 対応</span>
              </label>
            </div>

            {previewUrl && (
              <div className="relative h-40 w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <img src={previewUrl} alt="Preview" className="object-contain w-full h-full" />
              </div>
            )}

            {scanLoading && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4" role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                  <Loader2 className="shrink-0 animate-spin text-sky-600" size={22} />
                  <div>
                    <p className="text-sm font-semibold text-sky-900">{scanStatus || '解析しています...'}</p>
                    <p className="text-[11px] text-sky-700 mt-1">
                      画面を閉じずにお待ちください（最大30秒）
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-sky-500" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsScanOpen(false)} disabled={scanLoading} className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50">
                キャンセル
              </button>
              <button type="button" onClick={handleScanSubmit} disabled={scanLoading || !selectedFile} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5">
                {scanLoading && <Loader2 size={14} className="animate-spin" />}
                {scanLoading ? '解析中...' : '解析して保存'}
              </button>
            </div>
            {scanError && (
              <p role="alert" className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                {scanError}
              </p>
            )}
            </div>
          </div>
        </div>
      )}

      {/* 手動入力モーダル */}
      {isManualOpen && (
        <div className="fixed inset-0 overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 z-50">
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">手動でデータを追加</h3>
              <button onClick={() => setIsManualOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">種別</label>
                <div className="grid grid-cols-2 gap-2">
                  {['expense', 'income'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setManualForm({
                        ...manualForm,
                        type,
                        category: type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
                      })}
                      className={`py-2 rounded-xl border text-center font-semibold transition-all ${manualForm.type === type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                    >
                      {type === 'expense' ? '支出' : '収入'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">金額 (円)</label>
                <input
                  type="number"
                  required
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  placeholder="1200"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">店舗 / 発行元</label>
                <input
                  type="text"
                  value={manualForm.merchant}
                  onChange={(e) => setManualForm({ ...manualForm, merchant: e.target.value })}
                  placeholder="コンビニ、スーパーなど"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">カテゴリ</label>
                <select
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                >
                  {(manualForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">日付</label>
                <input
                  type="date"
                  value={manualForm.transaction_date}
                  onChange={(e) => setManualForm({ ...manualForm, transaction_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsManualOpen(false)} className="px-4 py-2 border border-slate-200 font-medium rounded-xl hover:bg-slate-50">
                  キャンセル
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800">
                  追加する
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {isAccountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">アカウント設定</h2>
                <p className="text-xs text-slate-400 mt-1">登録情報とログイン情報を変更できます。</p>
              </div>
              <button type="button" onClick={() => setIsAccountOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {accountError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{accountError}</div>}
              {accountSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">{accountSuccess}</div>}

              {!accountAction ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[
                    { id: 'displayName', label: 'ニックネームを変更', icon: User },
                    { id: 'email', label: 'メールアドレスを変更', icon: Mail },
                    { id: 'password', label: 'パスワードを変更', icon: KeyRound },
                    { id: 'delete', label: '退会する', icon: AlertTriangle, danger: true },
                  ].map(({ id, label, icon: Icon, danger }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setAccountError('');
                        setAccountSuccess('');
                        setAccountAction(id);
                      }}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                        danger
                          ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              ) : accountAction === 'delete' ? (
                <div className="p-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50">
                  <div className="flex items-center gap-2 text-rose-700 text-sm font-semibold">
                    <AlertTriangle size={16} /> 退会の確認
                  </div>
                  <p className="text-xs text-rose-600 mt-2 leading-relaxed">
                    退会するとアカウントと関連データを削除し、元に戻せません。
                    本人確認のため、現在のパスワードを入力してください。
                  </p>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(event) => setDeletePassword(event.target.value)}
                      placeholder="現在のパスワード"
                      className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleAccountDeletion}
                      disabled={accountLoading || !deletePassword}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 disabled:opacity-40"
                    >
                      {accountLoading ? '処理中...' : '退会する'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAccountUpdate} className="space-y-4 mt-4">
                  {accountAction === 'displayName' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">新しいニックネーム</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          maxLength={50}
                          value={accountForm.displayName}
                          onChange={(event) => setAccountForm({ ...accountForm, displayName: event.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {accountAction === 'email' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">新しいメールアドレス</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={accountForm.email}
                          onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {accountAction === 'password' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">新しいパスワード</label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="password"
                            required
                            minLength={8}
                            value={accountForm.password}
                            onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })}
                            placeholder="8文字以上"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">新しいパスワード（確認）</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={accountForm.passwordConfirmation}
                          onChange={(event) => setAccountForm({ ...accountForm, passwordConfirmation: event.target.value })}
                          placeholder="もう一度入力してください"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={accountLoading} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                    {accountLoading ? '更新中...' : 'この変更を保存'}
                  </button>
                </form>
              )}

              {accountAction && (
                <button
                  type="button"
                  onClick={() => {
                    setAccountAction('');
                    setAccountError('');
                    setAccountSuccess('');
                  }}
                  className="w-full mt-4 text-xs text-slate-500 hover:text-slate-900"
                >
                  操作選択に戻る
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}