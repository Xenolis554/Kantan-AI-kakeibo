import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, PiggyBank } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const getAuthErrorMessage = (error) => {
    const message = error instanceof Error ? error.message : '';

    if (message.toLowerCase().includes('email rate limit exceeded')) {
      return '確認メールの送信回数が上限に達しています。しばらく時間をおいてから、同じメールアドレスで再度お試しください。迷惑メールフォルダもご確認ください。';
    }

    if (message.toLowerCase().includes('error sending confirmation email')) {
      return '確認メールを送信できませんでした。Supabaseのメール設定または送信先アドレスを確認して、時間をおいてから再度お試しください。';
    }

    return message || '認証処理に失敗しました。入力内容をご確認ください。';
  };

  useEffect(() => {
    if (router.isReady && router.query.confirmed === '1') {
      setSuccessMsg('メールアドレスの確認が完了しました。メールアドレスとパスワードでログインしてください。');
    } else if (router.isReady && router.query.emailChanged === '1') {
      setSuccessMsg('メールアドレスの変更が完了しました。新しいメールアドレスでログインしてください。');
    }
  }, [router.isReady, router.query.confirmed, router.query.emailChanged]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        if (password !== passwordConfirmation) {
          throw new Error('パスワードが一致していません。');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
            data: {
              display_name: displayName.trim(),
              birth_date: birthDate,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg(
          '確認メールを送信しました。メール内の URL をクリックして登録を完了させてください。'
        );
        setIsSignUp(false);
        setEmail(email);
        setPassword('');
        setPasswordConfirmation('');
        setDisplayName('');
        setBirthDate('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景グリッドパターン */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-rose-100">
              <PiggyBank size={27} strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              かんたん家計簿
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              簡単に続けられる家計簿ダッシュボード
            </p>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl leading-relaxed">
              <div className="font-semibold mb-1">登録確認のお知らせ</div>
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                メールアドレス / ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8文字以上"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  パスワード（確認）
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="もう一度入力してください"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  表示名
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="山田 太郎"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  生年月日
                </label>
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-slate-900 text-white font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                '処理中...'
              ) : (
                <>
                  {isSignUp ? '新規アカウント作成' : 'ログイン'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {!isSignUp && (
            <div className="mt-4 text-center">
              <Link
                href="/forgot-password"
                className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
              >
                パスワードをお忘れの方
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              {isSignUp
                ? 'すでにアカウントをお持ちの方はこちら (ログイン)'
                : 'アカウントをお持ちでない方はこちら (新規登録)'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mt-6">
          <ShieldCheck size={14} />
          <span>プライベート運用・高セキュリティ環境</span>
        </div>
      </div>
    </div>
  );
}