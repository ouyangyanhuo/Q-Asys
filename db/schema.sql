-- 尺素 · 建表脚本
-- 用法：Neon 控制台 → SQL Editor → 整段粘贴执行（首次部署前先跑一遍）

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

-- 老库补列（新库上面已包含，可重复执行）
alter table questions add column if not exists visitor_hash text;

create index if not exists questions_visitor_idx
  on questions (visitor_hash, created_at desc);

-- 限流：按 ip_hash 统计最近一小时
create index if not exists questions_rate_idx
  on questions (ip_hash, created_at desc);

-- 固定窗口限流计数：每个 (key, window_start) 一行，upsert 原子自增
-- key 形如 "ip:ab12…:1m" / "global:1h"，window_start 是窗口起点
create table if not exists rate_counters (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);

create index if not exists rate_counters_gc_idx
  on rate_counters (window_start);
