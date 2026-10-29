create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  merchant text,
  memo text,
  purchase_time time,
  transaction_date date not null,
  created_at timestamptz not null default now()
);

alter table public.transactions add column if not exists memo text;
alter table public.transactions add column if not exists purchase_time time;

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own transaction items" on public.transaction_items;
create policy "Users can view their own transaction items"
  on public.transaction_items for select
  using (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_items.transaction_id
        and transactions.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert their own transaction items" on public.transaction_items;
create policy "Users can insert their own transaction items"
  on public.transaction_items for insert
  with check (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_items.transaction_id
        and transactions.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own transaction items" on public.transaction_items;
create policy "Users can update their own transaction items"
  on public.transaction_items for update
  using (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_items.transaction_id
        and transactions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_items.transaction_id
        and transactions.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own transaction items" on public.transaction_items;
create policy "Users can delete their own transaction items"
  on public.transaction_items for delete
  using (
    exists (
      select 1
      from public.transactions
      where transactions.id = transaction_items.transaction_id
        and transactions.user_id = auth.uid()
    )
  );
