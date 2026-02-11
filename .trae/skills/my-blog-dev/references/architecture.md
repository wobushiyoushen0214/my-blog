# 项目架构速览（my-blog）

## 技术栈

- Next.js App Router（`app/`）+ React + TypeScript
- Supabase（Postgres + Auth + RLS）：封装在 `lib/supabase/`，SQL 在 `supabase/`
- Tailwind CSS（v4）+ shadcn/ui：组件在 `components/ui/`
- 富文本：TipTap（最终以 HTML 字符串存储/渲染）

## 目录与职责

- `app/`：路由与页面（Server Components 为主）
  - `app/page.tsx`：首页列表（分页）
  - `app/blog/[slug]/page.tsx`：文章详情（含阅读量 + 评论）
  - `app/api/views/[slug]/route.ts`：阅读量 API
  - `app/rss.xml/route.ts`：RSS
  - `app/sitemap.ts`：站点地图
  - `app/admin/*`：后台管理（写作/标签/分类/评论）
- `components/`：可复用 UI/业务组件
  - `components/admin/post-form.tsx`：文章新增/编辑表单（含 TipTap、标签关联）
  - `components/tiptap-editor.tsx`：富文本编辑器（输出 HTML）
- `lib/`
  - `lib/supabase/client.ts`：浏览器 Supabase client
  - `lib/supabase/server.ts`：服务端 Supabase client（cookies 透传）
  - `lib/supabase/middleware.ts`：鉴权守卫与 session 刷新
  - `lib/types.ts`：前端使用的数据类型
  - `lib/utils.ts`：`cn()` 与 `generateSlug()`
- `supabase/`
  - `supabase/schema.sql`：表结构 + RLS policies
  - `supabase/seed.sql`：管理员种子（仅限受控环境执行）

## 关键约定

- **后台鉴权**：`/admin/*` 由根 `middleware.ts` 统一拦截，未登录重定向 `/admin/login`
- **内容存储**：`posts.content` 存 HTML；详情页直接渲染 `dangerouslySetInnerHTML`
- **slug 生成**：创建文章时默认用 `generateSlug()` 生成 10 位随机串（非标题派生）
