# 常用工作流（my-blog）

## 本地开发

- 启动：`npm run dev`
- 构建：`npm run build`
- 生产启动：`npm run start`
- Lint：`npm run lint`

## 环境变量（必需）

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`（用于 RSS/Sitemap 的绝对 URL）

## 新增页面（App Router）

- 在 `app/<route>/page.tsx` 新建页面文件
- 需要 SEO 时优先用：
  - `export const metadata = { ... }`（静态）
  - 或 `export async function generateMetadata(...)`（动态，如 blog 详情）
- 需要请求数据时：
  - Server Component：调用 `await createClient()`（`lib/supabase/server.ts`）
  - Client Component：用 `createClient()`（`lib/supabase/client.ts`）并在事件中请求

## 新增 API（Route Handler）

- 在 `app/api/<name>/route.ts` 新建 `GET/POST` 等方法
- 访问 DB：
  - 若需要带登录态 cookies：用 `await createClient()`（server client）
  - 仅公开读：也可用 server client（统一）

## 后台功能（/admin）

- 路由放在 `app/admin/*`
- 默认已被 middleware 守卫
- 表单提交/写入：
  - 走 Supabase RLS：只给 `authenticated` 写权限（见 `supabase/schema.sql`）
  - 前端写入建议在 Client Component 里调用浏览器 client，并基于 toast 做反馈

## 数据库变更（Supabase）

- 修改 `supabase/schema.sql`
- 同步更新前端类型：`lib/types.ts`
- RLS 检查清单：
  - 表开启 RLS
  - 公开读策略（如只读 `published=true`）
  - `authenticated` 拥有管理策略（insert/update/delete）
