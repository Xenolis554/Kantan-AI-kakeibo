import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

const DAILY_PARSE_LIMIT = 10;
const MAX_RETRIES = 3;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

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

      const usageDate = new Date().toISOString().slice(0, 10);
      const { imageBase64, mimeType } = req.body || {};
      if (!imageBase64) {
        return res.status(400).json({ error: '画像データが送信されていません。' });
      }

      const { data: usageAccepted, error: usageError } = await supabase.rpc(
        'consume_receipt_parse_quota',
        {
          p_user_id: user.id,
          p_usage_date: usageDate,
          p_daily_limit: DAILY_PARSE_LIMIT,
        }
      );
      if (usageError) {
        console.error('Receipt parse usage error:', usageError);
        return res.status(500).json({ error: '利用上限を確認できませんでした。' });
      }
      if (!usageAccepted) {
        return res.status(429).json({
          error: `本日の画像解析上限（${DAILY_PARSE_LIMIT}回）に達しました。明日もう一度お試しください。`,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      let response;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
        try {
          response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
              {
                inlineData: {
                  data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
                  mimeType: mimeType || 'image/jpeg',
                },
              },
              `レシートまたはクレジットカード利用明細の画像を解析し、説明文なしで次のJSONだけを返してください。
{"type":"expense","category":"食費","amount":0,"merchant":"","transaction_date":"YYYY-MM-DD","items":[{"name":"","amount":0}]}
支出の category は食費、日用品、衣類・ファッション、住居費、水道光熱費、通信費、交通費、医療費、保険、教育・学習、娯楽・レジャー、美容・理容、交際費、税金・社会保険、サブスクリプション、手数料、その他から選んでください。
クレジットカード利用明細の場合も、クレジットカードは決済手段でありカテゴリにはしないでください。明細の店舗名、利用先、摘要、商品名などから、実際の支出内容に最も近い category を判断してください。判断できない場合だけその他を選んでください。
給与や入金明細は type を income にし、category は給与・収入、賞与、副業収入、臨時収入、その他収入から選んでください。`,
            ],
          });
          break;
        } catch (error) {
          if (!isRetryableError(error) || attempt === MAX_RETRIES - 1) {
            if (isRetryableError(error)) {
              return res.status(503).json({
                error: 'AIサービスが混雑しています。時間をおいてもう一度お試しください。',
              });
            }
            throw error;
          }
          const delay = 1000 * (2 ** attempt) + Math.floor(Math.random() * 500);
          await wait(delay);
        }
      }

    const match = (response.text || '').match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(502).json({ error: 'AIの応答からJSONを抽出できませんでした。' });
    }

    return res.status(200).json({ success: true, data: JSON.parse(match[0]) });
  } catch (error) {
    console.error('Receipt parsing API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'サーバーエラーが発生しました。',
    });
  }
}
