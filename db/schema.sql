-- 拾光信箱 · 建表脚本
-- 用法：Neon 控制台 → SQL Editor → 整段粘贴执行

create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  body        text not null check (char_length(body) between 1 and 500),
  nickname    text,
  status      text not null default 'pending'
              check (status in ('pending', 'published', 'hidden')),
  answer      text,
  answered_at timestamptz,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

-- 首页列表：按状态过滤 + 时间倒序
create index if not exists questions_public_idx
  on questions (status, created_at desc);

-- 限流：按 ip_hash 统计最近一小时
create index if not exists questions_rate_idx
  on questions (ip_hash, created_at desc);
