import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
              パスワードをお忘れの方
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              登録済みのメールアドレスに、パスワード再設定用のリンクをお送りします。登録済みでない場合送信されません。
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl leading-relaxed">
                パスワード再設定用のメールを送信しました。メールをご確認ください。
              </div>
              <Link
                href="/login"
                className="w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                ログイン画面に戻る
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="test@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-slate-900 text-white font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '送信中...' : '再設定メールを送信'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              ログイン画面に戻る
            </Link>
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
