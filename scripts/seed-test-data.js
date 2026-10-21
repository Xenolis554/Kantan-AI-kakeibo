const { createClient } = require('@supabase/supabase-js');
const { createTestExpenseRows } = require('../lib/testData');

const [, , userId, countArgument] = process.argv;
const count = countArgument === undefined ? 100 : Number(countArgument);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
  console.error('Usage: npm run seed:test -- <user-id> [count]');
  process.exit(1);
}

if (!Number.isInteger(count) || count < 1 || count > 1000) {
  console.error('count must be an integer between 1 and 1000.');
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedTestData() {
  const { error } = await supabase
    .from('transactions')
    .insert(createTestExpenseRows(userId, count));

  if (error) {
    throw new Error(`Failed to insert test data: ${error.message}`);
  }

  console.log(`Inserted ${count} test expense transactions for ${userId}.`);
}

seedTestData().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
