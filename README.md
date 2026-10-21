# Kantan AI kakeibo

レシート画像を解析できる家計簿アプリです。Next.js、Supabase、Gemini APIを使用しています。

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

   `.env.local` はGitにコミットしないでください。Service role keyとGemini API keyは、ブラウザ側のコードや公開リポジトリに絶対に書かないでください。

4. SupabaseのSQL Editorで [`schema.sql`](./schema.sql) を実行します。

5. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

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
