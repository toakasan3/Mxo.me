-- boards table
create table if not exists boards (
  code text primary key,
  name text not null default '',
  owner_id text not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

-- elements table
create table if not exists elements (
  id text primary key,
  board_code text not null references boards(code) on delete cascade,
  type text not null,
  x float not null default 0,
  y float not null default 0,
  data jsonb not null default '{}',
  author_id text not null,
  deleted boolean not null default false
);

-- coord_replies table
create table if not exists coord_replies (
  id uuid primary key default gen_random_uuid(),
  board_code text not null references boards(code) on delete cascade,
  coord_x integer not null,
  coord_y integer not null,
  author_id text not null,
  author_name text not null,
  message text not null check (char_length(message) <= 1000),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table boards enable row level security;
alter table elements enable row level security;
alter table coord_replies enable row level security;

-- RLS Policies: anyone can read
create policy "boards_select" on boards for select using (true);
create policy "elements_select" on elements for select using (true);
create policy "coord_replies_select" on coord_replies for select using (true);

-- Insert/update policies checked in API layer
create policy "boards_insert" on boards for insert with check (true);
create policy "elements_insert" on elements for insert with check (true);
create policy "coord_replies_insert" on coord_replies for insert with check (true);
create policy "elements_update" on elements for update using (true);
