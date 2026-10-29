import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import {
  CHART_COLORS,
  DAILY_MESSAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../lib/dashboardConstants';
import { formatDateKey, getCurrentMonth, getWeatherInfo } from '../lib/dashboardUtils';
import WeatherBanner from '../components/WeatherBanner';
import SummaryCards from '../components/SummaryCards';
import PeriodNavigator from '../components/PeriodNavigator';
import ChartsSection from '../components/ChartsSection';
import TransactionsTable from '../components/TransactionsTable';
import ReceiptScanModal from '../components/ReceiptScanModal';
import ManualTransactionModal from '../components/ManualTransactionModal';
import {
  Plus, LogOut, ShoppingBag, Utensils, Car, Zap, Shirt, Home as HomeIcon,
  Smartphone, Stethoscope, ShieldCheck, GraduationCap, Film,
  Scissors, Users, Landmark, Repeat, Receipt, Briefcase, Sparkles, X, PiggyBank,
  Settings, User, Mail, KeyRound, AlertTriangle
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [timeframe, setTimeframe] = useState('week'); // 'day' | 'week'
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const [transactionFilters, setTransactionFilters] = useState({
    type: 'all',
    category: 'all',
    date: '',
  });
  const [transactionSort, setTransactionSort] = useState('transaction_date_desc');
  const [weather, setWeather] = useState({ status: 'loading', temperature: null, code: null });
  const [dailyMessage] = useState(
    () => DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)]
  );
  
  // モーダル管理
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountClosing, setAccountClosing] = useState(false);
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
  const [scanSuccess, setScanSuccess] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const closeAccountSettings = () => {
    if (accountClosing) return;
    setAccountClosing(true);
    window.setTimeout(() => {
      setIsAccountOpen(false);
      setAccountClosing(false);
    }, 220);
  };

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
  }, [selectedMonth, transactionsPerPage, transactionFilters, transactionSort]);

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

  const fetchTransactions = async (userId, showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('id, type, category, amount, merchant, memo, purchase_time, transaction_date, created_at')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) console.error(error);
    else setTransactions(data || []);
    if (showLoading) setLoading(false);
    return { data, error };
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
      setScanSuccess('');
      setScanResult(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleScanSubmit = async () => {
    if (!selectedFile || scanLoading) return;
    setScanLoading(true);
    setScanStatus('画像を準備しています...');
    setScanError('');
    setScanSuccess('');
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
      if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.transaction_date)) {
        throw new Error('AIが読み取った日付の形式が正しくありません。');
      }
      if (
        parsed.purchase_time !== null
        && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(parsed.purchase_time)
      ) {
        throw new Error('AIが読み取った購入時刻の形式が正しくありません。');
      }
      setScanStatus('解析結果を保存しています...');
      const { data: insertedTx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: parsed.type,
          category: parsed.category,
          amount: parsed.amount,
          merchant: parsed.merchant,
          purchase_time: parsed.purchase_time,
          transaction_date: parsed.transaction_date,
        }])
        .select()
        .single();

      if (txError) throw txError;

      setTransactions((current) => [{
        id: insertedTx.id,
        type: parsed.type,
        category: parsed.category,
        amount: parsed.amount,
        merchant: parsed.merchant,
        purchase_time: parsed.purchase_time,
        transaction_date: parsed.transaction_date,
        memo: null,
        created_at: insertedTx.created_at || new Date().toISOString(),
      }, ...current]);
      setSelectedMonth(parsed.transaction_date.slice(0, 7));

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

      setSelectedFile(null);
      setPreviewUrl(null);
      setScanStatus('');
      setScanResult({
        ...parsed,
        id: insertedTx.id,
        created_at: insertedTx.created_at || new Date().toISOString(),
      });
      setScanSuccess(`${parsed.merchant}の${Number(parsed.amount).toLocaleString()}円を登録しました。`);
      const { error: refreshError } = await fetchTransactions(user.id, false);
      if (refreshError) {
        console.error('登録後の取引履歴更新に失敗しました。', refreshError);
      }
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

  const handleTransactionUpdate = async (id, updates) => {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchTransactions(user.id, false);
  };

  const selectedMonthTransactions = transactions.filter((transaction) =>
    typeof transaction.transaction_date === 'string'
      && transaction.transaction_date.startsWith(selectedMonth)
  );
  const filteredTransactions = selectedMonthTransactions.filter((transaction) => (
    (transactionFilters.type === 'all' || transaction.type === transactionFilters.type)
    && (transactionFilters.category === 'all' || transaction.category === transactionFilters.category)
    && (!transactionFilters.date || transaction.transaction_date === transactionFilters.date)
  ));
  const sortField = transactionSort.startsWith('created_at') ? 'created' : 'transaction';
  const sortDirection = transactionSort.endsWith('_asc') ? 'asc' : 'desc';
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = sortField === 'created' ? a.created_at || '' : a.transaction_date || '';
    const bValue = sortField === 'created' ? b.created_at || '' : b.transaction_date || '';
    return sortDirection === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
  const transactionPageCount = Math.max(1, Math.ceil(sortedTransactions.length / transactionsPerPage));
  const visibleTransactions = sortedTransactions.slice(
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
  const currentYear = new Date().getFullYear();
  const transactionYears = transactions
    .map((transaction) => transaction.transaction_date?.slice(0, 4))
    .filter((year) => /^\d{4}$/.test(year))
    .map(Number);
  const availableYears = Array.from(
    new Set([currentYear - 5, currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear, ...transactionYears])
  ).sort((a, b) => b - a);
  const todayLabel = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());
  const weatherInfo = weather.code === null ? null : getWeatherInfo(weather.code);
  const moveMonth = (amount) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + amount, 1);
    setSelectedMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    );
    setTransactionPage(1);
  };

  // カテゴリ用アイコンマッピング
  const getCategoryIcon = (category) => {
    switch (category) {
      case '食費': return <Utensils size={14} />;
      case '日用品': return <ShoppingBag size={14} />;
      case '衣類・ファッション': return <Shirt size={14} />;
      case '住居費': return <HomeIcon size={14} />;
      case '水道光熱費':
      case '光熱費・公共料金': return <Zap size={14} />;
      case '通信費': return <Smartphone size={14} />;
      case '交通費': return <Car size={14} />;
      case '医療費': return <Stethoscope size={14} />;
      case '保険': return <ShieldCheck size={14} />;
      case '教育・学習': return <GraduationCap size={14} />;
      case '娯楽・レジャー': return <Film size={14} />;
      case '美容・理容': return <Scissors size={14} />;
      case '交際費': return <Users size={14} />;
      case '税金・社会保険': return <Landmark size={14} />;
      case 'サブスクリプション': return <Repeat size={14} />;
      case '手数料': return <Receipt size={14} />;
      case '給与・収入': return <Briefcase size={14} />;
      case '賞与':
      case '副業収入':
      case '臨時収入':
      case 'その他収入':
      case 'その他':
      default: return <Receipt size={14} />;
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
            className="motion-action w-full mb-4 border border-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm"
          >
            <Settings size={15} /> アカウント設定
          </button>

          <nav className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setScanSuccess('');
                setScanError('');
                setScanResult(null);
                setIsScanOpen(true);
              }}
              className="motion-action w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm hover:shadow text-sm"
            >
              <Sparkles size={15} /> AIスキャン登録
            </button>
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              className="motion-action w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm"
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
        <WeatherBanner
          todayLabel={todayLabel}
          dailyMessage={dailyMessage}
          weather={weather}
          weatherInfo={weatherInfo}
        />

        <PeriodNavigator
          selectedMonth={selectedMonth}
          selectedMonthLabel={selectedMonthLabel}
          availableYears={availableYears}
          selectedMonthTransactionCount={selectedMonthTransactions.length}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          onMoveMonth={moveMonth}
          onYearChange={(year) => {
            const [, month] = selectedMonth.split('-');
            setSelectedMonth(`${year}-${month}`);
          }}
        />
        
        {/* サマリーカード */}
        <SummaryCards totalIncome={totalIncome} totalExpense={totalExpense} />

        <ChartsSection
          categoryData={categoryData}
          trendData={trendData}
          timeframe={timeframe}
          chartColors={CHART_COLORS}
          onTimeframeChange={setTimeframe}
        />

        <TransactionsTable
          transactions={visibleTransactions}
          totalCount={sortedTransactions.length}
          page={transactionPage}
          pageCount={transactionPageCount}
          perPage={transactionsPerPage}
          onPageChange={setTransactionPage}
          onPerPageChange={setTransactionsPerPage}
          onDelete={handleDelete}
          onUpdate={handleTransactionUpdate}
          filters={transactionFilters}
          onFiltersChange={setTransactionFilters}
          sortOrder={transactionSort}
          onSortOrderChange={setTransactionSort}
          getCategoryIcon={getCategoryIcon}
          expenseCategories={EXPENSE_CATEGORIES}
          incomeCategories={INCOME_CATEGORIES}
        />
      </main>

      {isScanOpen && (
        <ReceiptScanModal
          previewUrl={previewUrl}
          scanLoading={scanLoading}
          scanStatus={scanStatus}
          scanError={scanError}
          scanSuccess={scanSuccess}
          scanResult={scanResult}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onSubmit={handleScanSubmit}
          onClose={() => {
            setIsScanOpen(false);
            setScanSuccess('');
            setScanResult(null);
          }}
        />
      )}

      {isManualOpen && (
        <ManualTransactionModal
          form={manualForm}
          expenseCategories={EXPENSE_CATEGORIES}
          incomeCategories={INCOME_CATEGORIES}
          onChange={setManualForm}
          onSubmit={handleManualSubmit}
          onClose={() => setIsManualOpen(false)}
        />
      )}

      {isAccountOpen && (
        <div className="motion-backdrop fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`motion-panel ${accountClosing ? 'motion-panel-closing' : ''} bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">アカウント設定</h2>
                <p className="text-xs text-slate-400 mt-1">登録情報とログイン情報を変更できます。</p>
              </div>
              <button type="button" onClick={closeAccountSettings} disabled={accountClosing} className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-50">
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