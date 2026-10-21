import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setErrorMsg('');

    if (password !== confirmation) {
      setErrorMsg('パスワードが一致していません。');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setCompleted(true);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-md">
              M
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              新しいパスワードを設定
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              8文字以上のパスワードを入力してください。
            </p>
          </div>

          {completed ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl leading-relaxed">
                パスワードを変更しました。新しいパスワードでログインできます。
              </div>
              <Link
                href="/login"
                className="w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                ログイン画面へ
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  新しいパスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  新しいパスワード（確認）
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-slate-900 text-white font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '変更中...' : 'パスワードを変更する'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mt-6">
          <ShieldCheck size={14} />
          <span>プライベート運用・高セキュリティ環境</span>
        </div>
      </div>
    </div>
  );
}
