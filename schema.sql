create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchased_at date,
  merchant text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category text,
  receipt_url text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

create table if not exists public.receipt_parse_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists receipt_parse_usage_user_date_idx
  on public.receipt_parse_usage (user_id, usage_date);

alter table public.receipt_parse_usage enable row level security;

create or replace function public.consume_receipt_parse_quota(
  p_user_id uuid,
  p_usage_date date,
  p_daily_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_count integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_usage_date::text, 0)
  );

  select count(*) into usage_count
  from public.receipt_parse_usage
  where user_id = p_user_id
    and usage_date = p_usage_date;

  if usage_count >= p_daily_limit then
    return false;
  end if;

  insert into public.receipt_parse_usage (user_id, usage_date)
  values (p_user_id, p_usage_date);
  return true;
end;
$$;

revoke all on function public.consume_receipt_parse_quota(uuid, date, integer) from public;
grant execute on function public.consume_receipt_parse_quota(uuid, date, integer) to service_role;
