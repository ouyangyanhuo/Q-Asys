# 尺素

一个纸与墨水气质的匿名提问箱。前端 Next.js，数据存 Neon Postgres，部署在 Vercel。

## 本地跑起来

```bash
bun install
bun dev
```

打开 http://localhost:3000 就能看到完整效果。**不需要任何配置**——没配数据库时会自动降级到
`.data/db.json` 文件库，并写入几封示例信件；本地开发模式（没有 `AUTH_GITHUB_ID`）下
`/admin` 直接可进。

## 页面

| 路径 | 说明 |
| --- | --- |
| `/` | 公开信箱：首屏提问 + 已回信的列表（ISR，60 秒） |
| `/q/[id]` | 单封信的分享页，带邮戳 |
| `/admin` | 收件箱与回信面板，需要登录 |
| `/admin/login` | GitHub 登录入口 |

## 环境变量

复制 `.env.example` 为 `.env.local` 再填。全部可以不填，本地照常运行。

| 变量 | 作用 |
| --- | --- |
| `DATABASE_URL` | Neon 连接串。填了就走真库，不填走本地文件 |
| `AUTH_SECRET` | 会话签名密钥，上线必须改成长随机串 |
| `IP_SALT` | IP 哈希盐，换掉之后旧的限流记录自动失效 |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App 的凭证 |
| `ALLOWED_GITHUB_LOGIN` | 允许进后台的 GitHub 用户名，逗号分隔；留空则任何 GitHub 账号都能进（线上别留空） |

## 接数据库

1. 在 Vercel 控制台的 Storage / Integrations 里添加 Neon，连接串会自动注入 `DATABASE_URL`。
2. 打开 Neon 控制台的 SQL Editor，把 `db/schema.sql` 整段贴进去执行。
3. 重新部署。

## 接 GitHub 登录

在 GitHub → Settings → Developer settings → OAuth Apps 新建一个应用：

- Homepage URL：`https://你的域名`
- Authorization callback URL：`https://你的域名/api/auth/github/callback`

拿到 Client ID / Secret 填进环境变量，再把 `ALLOWED_GITHUB_LOGIN` 设成自己的用户名。

本地调试时回调地址填 `http://localhost:3000/api/auth/github/callback`。

## 数据怎么存

只有一张表 `questions`，`status` 是 `pending / published / hidden`。

访客提交 → Server Action 净化与限流 → 写入 `pending`。
你在后台点「回信并公开」才会变成 `published`，同时 `revalidatePath("/")` 让首页缓存立刻失效。

数据库里没有「提问者」这个字段，也没有明文 IP——`ip_hash` 只用于限流，盐在环境变量里。

## 安全

**输入过滤**（`src/lib/sanitize.ts`）

1. **长度粗筛**：先按 `maxLength × 20` 挡掉超长载荷，再跑正则，避免回溯打满 CPU。
2. **归一化**：NFC 统一编码、`\r\n → \n`；剔除零宽字符（`U+200B–200F`）、软连字符、双向覆盖符（`U+202A–202E`）与控制字符（保留 `\t` `\n`）。这些字符肉眼不可见，却能把 `scr​ipt` 拆开绕过关键词检测。
3. **危险内容**：`<script>`/`<iframe>`/`<svg>` 等危险标签、`on*=` 事件属性、`javascript:` 与 `data:text/html` 协议、高置信度注入载荷（`' or 1=1`、`union select`、`drop table`、`information_schema`、`pg_sleep` 等）——**命中即拒绝**，不做静默清理，因为「清理后入库」等于替攻击者猜意图。
4. **普通标签**：`<b>` 这类从别处粘贴带进来的格式标签直接剥掉，只留文字；剥完仍残留标记形态的按 `markup` 拒绝。
5. **落库**：全部走 neon 的模板参数（`${value}`），由驱动做参数绑定，从不拼字符串——这是防 SQL 注入的实际防线，黑名单只是兜底。

**失败返回**

Server Action 返回结构化状态，前端只显示 `message`，不包含任何原始输入：

| code | 触发 | 提示 |
|---|---|---|
| `empty` | 空串、纯标点 | 尚无一字。 |
| `too_long` | 超过 500 字（落款 16 字） | 至多 500 字，请删减几分。 |
| `control_chars` | 含控制字符 | 文中有无法识别的字符，请重新誊写。 |
| `unsafe_markup` | 危险标签/事件属性/协议 | 此中含有可执行的内容，恕不能收录。 |
| `unsafe_sql` | 命中注入载荷 | 此中含有数据库指令，恕不能收录。 |
| `rate_limited` | 超限 | 今日信箧已满，请 N 分钟后再试。 |
| `storage` | 落库异常 | 落笔未能入箱，请稍后再试。 |

**限流**（`src/lib/rate-limit.ts`）

| 维度 | 阈值 | 窗口 | 作用 |
|---|---|---|---|
| 单来源（`ip_hash`） | 3 | 60 秒 | 挡连点与脚本试探 |
| 单来源（`ip_hash`） | 5 | 1 小时 | 挡刷屏 |
| 全站 | 40 | 1 小时 | 挡分布式 IP 池把库写爆 |

计数落在 `rate_counters` 表，每次请求一条 `insert … on conflict do update set hits = hits + 1 returning hits`，把「读—改—写」压进单条 SQL，靠 Postgres 行锁保证原子。**不能放内存**：Vercel 函数多实例、随时冷启动，进程内计数会被并发成倍突破。超限的请求同样计数，避免「拒绝但不计数」被无限重试。计数表故障时放行并告警（fail-open），不让限流设施本身成为故障源。

## 设计

- 纸：`#f6f1e6` 底 + 一层极淡的 SVG 噪点做纸纤维
- 墨：`#1c1917`，不用纯黑
- 朱砂：`#b23a2c`，只出现在印章、投递按钮、答字标记上
- 提问用楷体（像手写的小纸条），回答用宋体（像铅字印刷）——手写问，印刷答
- 信件横格用 `repeating-linear-gradient`，行高锁 34px，输入的文字正好落在格线上
- 动效克制：入场 0.75s、盖章 0.52s，全部遵守 `prefers-reduced-motion`
