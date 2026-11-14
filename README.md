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

访客提交 → Server Action 校验（长度、蜜罐、`ip_hash` 每小时 5 条）→ 写入 `pending`。
你在后台点「回信并公开」才会变成 `published`，同时 `revalidatePath("/")` 让首页缓存立刻失效。

数据库里没有「提问者」这个字段，也没有明文 IP——`ip_hash` 只用于限流，盐在环境变量里。

## 设计

- 纸：`#f6f1e6` 底 + 一层极淡的 SVG 噪点做纸纤维
- 墨：`#1c1917`，不用纯黑
- 朱砂：`#b23a2c`，只出现在印章、投递按钮、答字标记上
- 提问用楷体（像手写的小纸条），回答用宋体（像铅字印刷）——手写问，印刷答
- 信件横格用 `repeating-linear-gradient`，行高锁 34px，输入的文字正好落在格线上
- 动效克制：入场 0.75s、盖章 0.52s，全部遵守 `prefers-reduced-motion`
