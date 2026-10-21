# Kantan AI kakeibo

レシート画像を解析できる家計簿アプリです。Next.js、Supabase、Gemini APIを使用しています。

## 作成のきっかけ

大学で学んだ知識と、実際の生活の中で「こんな機能があったら便利だな」と感じたことを組み合わせて、AIを活用しながら日々のQOL（生活の質）を向上させられるWebアプリケーションを作りたいと考えたことが開発のきっかけです。

家計簿は継続して記録することが大切ですが、レシートの内容を毎回手入力する作業は負担になりやすく、記録を続けるうえでの課題になります。そこで、Gemini APIによるレシート画像の解析、Supabaseによるデータ管理、Next.jsによる画面構築を組み合わせ、入力の手間を減らしながら支出を振り返りやすいアプリを目指しました。

## Supabaseの設定

### 1. プロジェクトを作成する

1. [Supabase](https://supabase.com/)にログインし、新しいプロジェクトを作成します。
2. Supabase Dashboardの **Project Settings > API** を開き、次の値を控えます。
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. `service_role key`はRLSを回避できる強い権限を持つため、ブラウザ側のコードやGitHubへ公開せず、サーバー側の環境変数だけで使用してください。

### 2. テーブルとRLSを作成する

Supabase Dashboardの **SQL Editor > New query** を開き、リポジトリの [`schema.sql`](./schema.sql) の内容を貼り付けて **Run** を実行します。

このSQLでは、次のテーブルを作成します。

- `transactions`: 支出・収入の基本情報
- `transaction_items`: レシート内の明細

どちらもユーザーごとのRow Level Security（RLS）を有効にしており、ログイン中のユーザーが自分のデータだけを取得・登録・変更・削除できる設定です。`transaction_items`は親の`transactions`が削除されたときに連動して削除されます。

SQL実行後、 **Table Editor** で`transactions`と`transaction_items`が作成されていることを確認してください。アプリは旧形式の`expenses`テーブルを使用していません。

### 3. Authenticationを設定する

Dashboardの **Authentication > Providers > Email** で、メールアドレスとパスワードによるログインを有効にします。

続けて **Authentication > URL Configuration** を設定します。

- **Site URL**: ローカルでは `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/**`
- 本番環境では、VercelなどにデプロイしたURLへ置き換え、必要なURLだけを登録します。

パスワードリセットやメールアドレス変更では、Supabaseが送信するメール内のURLからアプリへ戻ります。URLが未登録だと、メール内リンクが正しく動作しない場合があります。

### 4. Resendでメール送信を設定する

このアプリの認証メール（確認メール、パスワードリセット、メールアドレス変更）は、Supabase AuthenticationのSMTPに [Resend](https://resend.com/) を接続して送信します。ResendのAPIをアプリから直接呼び出す構成ではありません。

1. Resendでアカウントを作成します。
2. **Domains** から送信元ドメインを追加し、表示されるDNSレコード（SPF、DKIMなど）をドメイン管理サービスに登録します。
3. ドメインの認証が完了したら、Resendの **API Keys** で送信用のAPIキーを作成します。
4. Supabase Dashboardの **Authentication > SMTP Settings** を開き、次のように入力します。
   - **Enable Custom SMTP**: 有効
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465`（接続できない場合は`587`）
   - **SMTP User**: `resend`
   - **SMTP Password**: Resendで作成したAPIキー
   - **Sender email**: Resendで認証したドメインのメールアドレス（例: `noreply@example.com`）
   - **Sender name**: アプリ名など任意の表示名
5. SupabaseのSMTP設定画面にあるテスト送信機能で、メールが届くことを確認します。

ResendのAPIキーは`.env.local`に追加する必要はありません。Supabase DashboardのSMTP設定にだけ保存してください。送信元ドメインのDNS認証が完了していない場合、メールが迷惑メールに入ったり、送信に失敗したりすることがあります。

## ローカルで起動する

1. 依存関係をインストールします。

   ```bash
   npm install
   ```

2. 環境変数ファイルを作成します。

   ```bash
   cp .env.example .env.local
   ```

3. `.env.local` に、SupabaseとGeminiの値を設定します。

   - `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの公開Anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: SupabaseのService role key（サーバー側だけで使用）
   - `GEMINI_API_KEY`: Google AI Studioで発行したGemini API key（サーバー側だけで使用）
   - `GEMINI_MODEL`: 使用するGeminiモデル（省略時は`gemini-3.1-flash-lite`）

   `.env.local` はGitにコミットしないでください。Service role keyとGemini API keyは、ブラウザ側のコードや公開リポジトリに絶対に書かないでください。

4. 上記のSupabase設定とResendのSMTP設定を完了します。

5. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

## テストデータを登録する

テストデータは画面から登録できません。必要な場合だけ、Service Role Keyを設定したローカル環境で次のコマンドを実行します。

```bash
npm run seed:test -- <ユーザーID> [件数]
```

件数を省略すると100件登録されます。件数は1〜1000件です。ユーザーIDはSupabase DashboardのAuthentication > Usersで確認できます。

## Vercelなどへデプロイする場合

ホスティングサービスのプロジェクト設定に、`.env.local` の値を手入力で登録します。`NEXT_PUBLIC_` の値はクライアントへ公開されるためAnon keyだけを設定し、Service role keyとGemini API keyはサーバー側の環境変数として管理してください。

## APIキーが漏れた場合

キーをリポジトリ、コミット、ログ、チャットなどに貼り付けた場合は、GitHubで公開していなくても漏洩したものとして扱います。Google AI Studioまたは該当サービスの管理画面で直ちに無効化・再発行し、ローカルとデプロイ先の環境変数を新しいキーに置き換えてください。
