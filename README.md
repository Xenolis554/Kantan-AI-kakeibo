# Kantan AI kakeibo

レシート画像を解析できる家計簿アプリです。Next.js、Supabase、Gemini APIを使用しています。

## 作成のきっかけ

大学で学んだ知識と、実際の生活の中で「こんな機能があったら便利だな」と感じたことを組み合わせて、AIを活用しながら日々のQOL（生活の質）を向上させられるWebアプリケーションを作りたいと考えたことが開発のきっかけです。

家計簿は継続して記録することが大切ですが、レシートの内容を毎回手入力する作業は負担になりやすく、記録を続けるうえでの課題になります。そこで、Gemini APIによるレシート画像の解析、Supabaseによるデータ管理、Next.jsによる画面構築を組み合わせ、入力の手間を減らしながら支出を振り返りやすいアプリを目指しました。

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

4. SupabaseのSQL Editorで [`schema.sql`](./schema.sql) を実行します。

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

## GitHubへ公開する前の確認

以下を実行し、秘密情報や生成物がステージされていないことを確認します。

```bash
git status --short
git ls-files
```

特に、`.env.local`、`.env`、`node_modules/`、`.next/`、Service role key、Gemini API keyを含むファイルを追加しないでください。

初回公開の例:

```bash
git add .gitignore .env.example README.md package.json package-lock.json pages lib schema.sql postcss.config.js tailwind.config.js styles
git diff --cached --stat
git diff --cached -- .env.local .env
git commit -m "Initial public release"
git remote add origin https://github.com/<your-account>/<your-repository>.git
git push -u origin main
```

`git diff --cached -- .env.local .env` に出力があれば、コミットせずにステージから外してください。

## Vercelなどへデプロイする場合

ホスティングサービスのプロジェクト設定に、`.env.local` の値を手入力で登録します。`NEXT_PUBLIC_` の値はクライアントへ公開されるためAnon keyだけを設定し、Service role keyとGemini API keyはサーバー側の環境変数として管理してください。

## APIキーが漏れた場合

キーをリポジトリ、コミット、ログ、チャットなどに貼り付けた場合は、GitHubで公開していなくても漏洩したものとして扱います。Google AI Studioまたは該当サービスの管理画面で直ちに無効化・再発行し、ローカルとデプロイ先の環境変数を新しいキーに置き換えてください。
