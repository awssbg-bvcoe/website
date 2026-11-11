-- Short links, click analytics and admin sessions.

create table if not exists links (
  id          bigint generated always as identity primary key,
  slug        text not null unique
              check (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
  url         text not null
              check (url ~ '^https?://' and length(url) <= 2048),
  note        text check (note is null or length(note) <= 280),
  enabled     boolean not null default true,
  expires_at  timestamptz,
  created_by  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per redirect. No IPs or user agents are stored: only coarse, non-identifying fields.
create table if not exists link_clicks (
  id             bigint generated always as identity primary key,
  link_id        bigint not null references links(id) on delete cascade,
  clicked_at     timestamptz not null default now(),
  referrer_host  text,
  country        text,
  device         text not null default 'unknown'
                 check (device in ('desktop', 'mobile', 'tablet', 'bot', 'unknown'))
);
create index if not exists link_clicks_link_time on link_clicks (link_id, clicked_at desc);

-- Admin sessions: only a SHA-256 of the random cookie token is stored, so a DB leak cannot be replayed.
create table if not exists admin_sessions (
  token_hash    text primary key,
  github_login  text not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  revoked_at    timestamptz
);
create index if not exists admin_sessions_login on admin_sessions (github_login);
