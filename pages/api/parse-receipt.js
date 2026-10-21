import { GoogleGenAI } from '@google/genai';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      return res.status(500).json({ error: 'GEMINI_API_KEYが設定されていません。' });
    }

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: '画像データが送信されていません。' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
