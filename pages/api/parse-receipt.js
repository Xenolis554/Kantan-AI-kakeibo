import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

const MAX_RETRIES = 1;
const REQUEST_COOLDOWN_MS = 10_000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-flash-lite-latest';
const lastParseRequests = new Map();

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isRetryableError = (error) => {
  const status = error?.status || error?.code;
  const message = error instanceof Error ? error.message : String(error);
  return status === 429
    || status === 503
    || status === 'UNAVAILABLE'
    || status === 'RESOURCE_EXHAUSTED'
    || /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message);
};

const parseModelResponse = (text) => {
  const normalized = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(normalized);
  if (
    !parsed
    || typeof parsed.is_financial_document !== 'boolean'
    || !['expense', 'income'].includes(parsed.type)
    || typeof parsed.category !== 'string'
    || typeof parsed.amount !== 'number'
    || typeof parsed.merchant !== 'string'
    || typeof parsed.transaction_date !== 'string'
    || (
      parsed.purchase_time != null
      && (
        typeof parsed.purchase_time !== 'string'
        || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(parsed.purchase_time)
      )
    )
    || !Array.isArray(parsed.items)
  ) {
    throw new Error('AIの解析結果の形式が正しくありません。');
  }
  parsed.purchase_time = parsed.purchase_time || null;
  return parsed;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!apiKey || apiKey === 'your-gemini-api-key') {
        return res.status(500).json({ error: 'GEMINI_API_KEYが設定されていません。' });
      }
      if (!serviceRoleKey || !supabaseUrl) {
        return res.status(500).json({ error: '画像解析APIのSupabase設定が不足しています。' });
    }

      const authorization = req.headers.authorization || '';
      const accessToken = authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : '';
      if (!accessToken) return res.status(401).json({ error: 'ログインが必要です。' });

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !user) return res.status(401).json({ error: '認証情報が無効です。' });

      const { imageBase64, mimeType } = req.body || {};
      if (!imageBase64) {
        return res.status(400).json({ error: '画像データが送信されていません。' });
      }

      const now = Date.now();
      const lastRequestAt = lastParseRequests.get(user.id) || 0;
      if (now - lastRequestAt < REQUEST_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil(
          (REQUEST_COOLDOWN_MS - (now - lastRequestAt)) / 1000
        );
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          error: `連続解析を防止するため、${retryAfterSeconds}秒後にもう一度お試しください。`,
        });
      }
      lastParseRequests.set(user.id, now);

      const ai = new GoogleGenAI({ apiKey });
    const models = GEMINI_MODEL === FALLBACK_MODEL
      ? [GEMINI_MODEL]
      : [GEMINI_MODEL, FALLBACK_MODEL];
    let parsed;
    let lastError;
    for (const model of models) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                inlineData: {
                  data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
                  mimeType: mimeType || 'image/jpeg',
                },
              },
              `画像の内容を読み取り、JSONオブジェクトだけを返してください。Markdownのコードブロックや説明文は不要です。
レシート、公共料金の請求書、給与明細、入金明細、クレジットカード利用明細など、家計簿の取引として登録できる金銭関連の書類かを判定してください。対象の書類であれば is_financial_document は true、風景、人物、動物、料理、一般文書、画面キャプチャなど対象外の画像であれば false にしてください。対象外の場合も、他の項目は推測せず、空文字や0などの形式だけを埋めてください。
{"is_financial_document":true,"type":"expense","category":"食費","amount":0,"merchant":"","transaction_date":"YYYY-MM-DD","purchase_time":"HH:MM","items":[{"name":"","amount":0}]}
購入時刻がレシートに記載されている場合は24時間制の HH:MM 形式で読み取ってください。記載がない、または判別できない場合は purchase_time を null にしてください。
支出の category は食費、日用品、衣類・ファッション、住居費、水道光熱費、通信費、交通費、医療費、保険、教育・学習、娯楽・レジャー、美容・理容、交際費、税金・社会保険、サブスクリプション、手数料、その他から選んでください。
クレジットカード利用明細の場合も、クレジットカードは決済手段でありカテゴリにはしないでください。明細の店舗名、利用先、摘要、商品名などから、実際の支出内容に最も近い category を判断してください。判断できない場合だけその他を選んでください。
給与や入金明細は type を income にし、category は給与・収入、賞与、副業収入、臨時収入、その他収入から選んでください。`,
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });
          parsed = parseModelResponse(response.text || '');
          break;
        } catch (error) {
          lastError = error;
          if (!isRetryableError(error)) {
            break;
          }
          if (attempt === MAX_RETRIES - 1) {
            break;
          }
          const delay = 1000 * (2 ** attempt) + Math.floor(Math.random() * 500);
          await wait(delay);
        }
      }
      if (parsed) break;
    }

    if (!parsed) {
      if (isRetryableError(lastError)) {
        return res.status(503).json({
          error: 'AIサービスが混雑しています。時間をおいてもう一度お試しください。',
        });
      }
      console.error('Receipt parse response error:', lastError);
      return res.status(502).json({
        error: lastError instanceof Error
          ? lastError.message
          : 'AIの解析結果を読み取れませんでした。',
      });
    }

    if (!parsed.is_financial_document) {
      return res.status(422).json({
        error: 'レシート、公共料金、給与明細などの家計簿に使える画像をアップロードしてください。',
      });
    }

    return res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    console.error('Receipt parsing API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'サーバーエラーが発生しました。',
    });
  }
}
