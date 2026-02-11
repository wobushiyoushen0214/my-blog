# 个人博客（Web + Admin + API）

这个仓库包含 3 个独立项目，分别部署到 Vercel：

- apps/web：博客展示（读已发布文章）
- apps/admin：后台管理（登录、文章增删改、发布/草稿）
- apps/api：后端 API（Vercel Functions + Supabase）

## Supabase 初始化

1. 创建 Supabase Project
2. 在 Supabase SQL Editor 执行 [0001_init.sql](file:///Users/lizhiwei/localProj/my-blog/supabase/migrations/0001_init.sql) 的内容
3. 在 Supabase Auth 里创建一个邮箱/密码用户作为后台管理员

## Vercel 部署

需要创建 3 个 Vercel Project，分别指向不同的根目录：

- Web：Root Directory 选择 `apps/web`
- Admin：Root Directory 选择 `apps/admin`
- API：Root Directory 选择 `apps/api`

### apps/api 环境变量

在 Vercel 的 API 项目中配置：

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAILS：管理员邮箱白名单，逗号分隔（可留空表示允许所有已登录用户调用管理接口）
- CORS_ORIGINS：允许跨域的前端域名白名单，逗号分隔，例如：
  - `https://xxx-web.vercel.app,https://xxx-admin.vercel.app`

### apps/web 环境变量

在 Vercel 的 Web 项目中配置：

- NEXT_PUBLIC_API_BASE_URL：你的 API 项目地址，例如 `https://xxx-api.vercel.app`

### apps/admin 环境变量

在 Vercel 的 Admin 项目中配置：

- NEXT_PUBLIC_API_BASE_URL：你的 API 项目地址，例如 `https://xxx-api.vercel.app`
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

并且把后台管理员的邮箱加入 API 项目的 `ADMIN_EMAILS`（如果你启用了白名单）。

## 本地开发

每个项目都可以单独运行：

```bash
cd apps/web && npm run dev
cd apps/admin && npm run dev
```

API 推荐使用 Vercel CLI 本地运行（可选）：

```bash
npm i -g vercel
cd apps/api && vercel dev --listen 3002
```

然后在 web/admin 的 `.env.local` 里配置：

- NEXT_PUBLIC_API_BASE_URL=http://localhost:3002

