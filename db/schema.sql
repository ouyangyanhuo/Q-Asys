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

-- 后台是全量列表（不带 status 过滤），需要一条只按时间的索引，
-- 否则 order by created_at desc limit 200 会退化成全表排序
create index if not exists questions_created_idx
  on questions (created_at desc);

-- 老库补列（新库上面已包含，可重复执行）
alter table questions add column if not exists visitor_hash text;

create index if not exists questions_visitor_idx
  on questions (visitor_hash, created_at desc);

-- 旧的「按 ip_hash 统计」索引已无用：限流改由 rate_counters 承担
drop index if exists questions_rate_idx;

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

-- 回函长度：应用层限 2000 字，这里在库层再兜一次
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questions_answer_len'
  ) then
    alter table questions
      add constraint questions_answer_len
      check (answer is null or char_length(answer) <= 2000);
  end if;
end $$;
