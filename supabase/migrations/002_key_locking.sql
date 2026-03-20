-- Add key-based ownership columns to elements table
alter table elements
  add column if not exists key_hash text null,
  add column if not exists key_hint text null,
  add column if not exists is_locked boolean not null default false;
