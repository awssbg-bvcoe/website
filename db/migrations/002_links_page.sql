-- /links page: which short links get a card there, what it says, and in what order.
-- `listed` defaults to false so existing (often private) short links never appear by surprise.
alter table links
  add column if not exists title       text check (title is null or length(title) <= 80),
  add column if not exists description text check (description is null or length(description) <= 140),
  add column if not exists listed      boolean not null default false,
  add column if not exists featured    boolean not null default false,
  add column if not exists sort_order  integer not null default 0;

create index if not exists links_page_order on links (featured desc, sort_order, id) where listed;
