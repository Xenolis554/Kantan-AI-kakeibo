import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!serviceRoleKey) {
    return res.status(500).json({
      error: '退会機能を利用するにはSUPABASE_SERVICE_ROLE_KEYの設定が必要です。',
    });
  }
  if (!anonKey) {
    return res.status(500).json({ error: 'SupabaseのAnon Keyが設定されていません。' });
  }

  const authorization = req.headers.authorization || '';
  const { password } = req.body || {};
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  if (!accessToken || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: '現在のパスワードを入力してください。' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
  if (userError || !user) return res.status(401).json({ error: '認証情報が無効です。' });

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: verified, error: passwordError } = await authClient.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (passwordError || verified.user?.id !== user.id) {
    return res.status(401).json({ error: 'パスワードが正しくありません。' });
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'アカウントの削除に失敗しました。' });
  }

  return res.status(200).json({ success: true });
}
