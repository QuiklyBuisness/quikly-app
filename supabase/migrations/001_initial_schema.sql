-- Quikly v1 schema
-- Run in Supabase SQL editor or via supabase db push

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";  -- for geo queries

-- ─── Profiles ─────────────────────────────────────────────
create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  role                  text not null check (role in ('customer', 'worker')),
  first_name            text not null,
  last_name             text not null,
  legal_name            text,
  avatar_url            text,
  phone                 text,
  gender                text,
  skills                text[],
  rating                decimal(3,2) default 5.00,
  jobs_completed        int default 0,
  verification_status   text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  stripe_account_id     text,
  stripe_customer_id    text,
  radius_miles          int default 2,
  lat                   decimal(9,6),
  lng                   decimal(9,6),
  neighborhoods         text[],
  is_online             boolean default false,
  online_at             timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── Jobs ─────────────────────────────────────────────────
create table jobs (
  id                    uuid primary key default uuid_generate_v4(),
  customer_id           uuid not null references profiles(id) on delete cascade,
  title                 text not null,
  description           text not null,
  full_description      text,
  category              text not null,
  urgency               text not null check (urgency in ('now', 'today', 'scheduled')),
  status                text not null default 'open' check (status in (
    'open', 'quoted', 'accepted', 'active', 'scope_changed',
    'complete', 'paid', 'cancelled'
  )),
  lat                   decimal(9,6),
  lng                   decimal(9,6),
  address               text,
  scheduled_for         timestamptz,
  budget                int,         -- cents, customer estimate
  locked_price          int,         -- cents, agreed price on quote accept
  ai_notice             text,        -- Claude photo analysis, worker-only
  notes                 text,
  bring                 text[],
  assigned_worker_id    uuid references profiles(id),
  stripe_payment_intent_id text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── Job Photos ───────────────────────────────────────────
create table job_photos (
  id        uuid primary key default uuid_generate_v4(),
  job_id    uuid not null references jobs(id) on delete cascade,
  url       text not null,
  type      text not null default 'photo' check (type in ('photo', 'video')),
  "order"   int default 0,
  created_at timestamptz default now()
);

-- ─── Quotes ───────────────────────────────────────────────
create table quotes (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references jobs(id) on delete cascade,
  worker_id   uuid not null references profiles(id),
  amount      int not null,   -- cents
  includes    text,
  eta         text not null default 'now' check (eta in ('now', '1hr', 'today')),
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at  timestamptz default now(),
  unique(job_id, worker_id)
);

-- ─── Scope Changes ────────────────────────────────────────
create table scope_changes (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references jobs(id) on delete cascade,
  worker_id       uuid not null references profiles(id),
  reason          text not null,
  photo_url       text,
  original_price  int not null,
  new_price       int not null,
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_at      timestamptz default now()
);

-- ─── Messages ─────────────────────────────────────────────
create table messages (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references jobs(id) on delete cascade,
  sender_id   uuid not null references profiles(id),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- ─── Reviews ──────────────────────────────────────────────
create table reviews (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid not null references jobs(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id),
  reviewee_id   uuid not null references profiles(id),
  rating        int not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz default now(),
  unique(job_id, reviewer_id)
);

-- ─── Payments ─────────────────────────────────────────────
create table payments (
  id                        uuid primary key default uuid_generate_v4(),
  job_id                    uuid not null references jobs(id),
  customer_id               uuid not null references profiles(id),
  worker_id                 uuid not null references profiles(id),
  stripe_payment_intent_id  text not null unique,
  amount                    int not null,
  platform_fee              int not null,
  worker_payout             int not null,
  status                    text not null default 'held' check (status in ('held', 'released', 'refunded')),
  created_at                timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────
create index jobs_status_urgency_idx on jobs(status, urgency);
create index jobs_customer_id_idx on jobs(customer_id);
create index jobs_assigned_worker_idx on jobs(assigned_worker_id);
create index quotes_job_id_idx on quotes(job_id);
create index messages_job_id_idx on messages(job_id);
create index profiles_is_online_idx on profiles(is_online) where is_online = true;

-- ─── Updated_at trigger ───────────────────────────────────
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function handle_updated_at();
create trigger jobs_updated_at before update on jobs
  for each row execute function handle_updated_at();

-- ─── Rating update trigger ────────────────────────────────
create or replace function update_worker_rating()
returns trigger language plpgsql as $$
begin
  update profiles
  set rating = (
    select avg(rating)::decimal(3,2) from reviews
    where reviewee_id = NEW.reviewee_id
  ),
  jobs_completed = (
    select count(*) from reviews where reviewee_id = NEW.reviewee_id
  )
  where id = NEW.reviewee_id;
  return NEW;
end;
$$;

create trigger after_review_insert after insert on reviews
  for each row execute function update_worker_rating();

-- ─── Row Level Security ───────────────────────────────────
alter table profiles     enable row level security;
alter table jobs         enable row level security;
alter table job_photos   enable row level security;
alter table quotes       enable row level security;
alter table scope_changes enable row level security;
alter table messages     enable row level security;
alter table reviews      enable row level security;
alter table payments     enable row level security;

-- Profiles
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Jobs
create policy "Anyone can view open jobs" on jobs for select using (
  status = 'open' or customer_id = auth.uid() or assigned_worker_id = auth.uid()
);
create policy "Customers can insert jobs" on jobs for insert with check (auth.uid() = customer_id);
create policy "Job participants can update" on jobs for update using (
  auth.uid() = customer_id or auth.uid() = assigned_worker_id
);

-- Photos
create policy "Anyone can view job photos" on job_photos for select using (true);
create policy "Job customer can insert photos" on job_photos for insert with check (
  exists (select 1 from jobs where id = job_id and customer_id = auth.uid())
);

-- Quotes
create policy "Job participants can view quotes" on quotes for select using (
  worker_id = auth.uid() or
  exists (select 1 from jobs where id = job_id and customer_id = auth.uid())
);
create policy "Workers can insert quotes" on quotes for insert with check (auth.uid() = worker_id);
create policy "Workers can update own quotes" on quotes for update using (auth.uid() = worker_id);

-- Messages
create policy "Job participants can view messages" on messages for select using (
  sender_id = auth.uid() or
  exists (select 1 from jobs where id = job_id and (customer_id = auth.uid() or assigned_worker_id = auth.uid()))
);
create policy "Job participants can send messages" on messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from jobs where id = job_id and (customer_id = auth.uid() or assigned_worker_id = auth.uid()))
);

-- Reviews
create policy "Anyone can view reviews" on reviews for select using (true);
create policy "Job participants can insert reviews" on reviews for insert with check (
  auth.uid() = reviewer_id and
  exists (select 1 from jobs where id = job_id and status = 'paid' and (customer_id = auth.uid() or assigned_worker_id = auth.uid()))
);

-- Payments
create policy "Job participants can view payments" on payments for select using (
  customer_id = auth.uid() or worker_id = auth.uid()
);

-- Scope changes
create policy "Job participants can view scope changes" on scope_changes for select using (
  worker_id = auth.uid() or
  exists (select 1 from jobs where id = job_id and customer_id = auth.uid())
);
create policy "Workers can insert scope changes" on scope_changes for insert with check (auth.uid() = worker_id);
