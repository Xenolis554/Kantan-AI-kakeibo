const getRandomTestDate = () => {
  const start = new Date('2026-08-01T00:00:00');
  const end = new Date('2026-10-31T00:00:00');
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const date = new Date(randomTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const createTestExpenseRows = (userId, count = 100) => {
  const merchantsByCategory = {
    食費: ['テストスーパー', 'テストコンビニ', 'テストレストラン'],
    日用品: ['テストドラッグストア', 'テストホームセンター'],
    交通費: ['テスト鉄道', 'テストタクシー', 'テスト航空'],
    娯楽・レジャー: ['テスト映画館', 'テスト施設'],
    通信費: ['テスト通信会社'],
    サブスクリプション: ['テスト動画サービス'],
  };
  const categories = Object.keys(merchantsByCategory);

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length];
    const merchants = merchantsByCategory[category];
    return {
      user_id: userId,
      type: 'expense',
      category,
      amount: (Math.floor(Math.random() * 19) + 1) * 500,
      merchant: merchants[index % merchants.length],
      transaction_date: getRandomTestDate(),
    };
  });
};

module.exports = {
  getRandomTestDate,
  createTestExpenseRows,
};
