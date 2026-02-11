---
name: my-blog-dev
description: 专用于 my-blog 的 Next.js App Router + Supabase 博客开发与维护；用于新增/修改页面路由与 API、完善 /admin 后台、调整 Supabase 表结构与 RLS、扩展 TipTap 富文本与内容渲染、维护 RSS/Sitemap/SEO，以及排查鉴权与数据查询问题。
---

# my-blog-dev

## 执行准则

- 优先复用项目现有模式与封装：Supabase client 统一从 `lib/supabase/*` 获取
- 保持“服务端/客户端边界”清晰：Server Component 用 server client；交互事件在 Client Component
- 不输出/不记录任何密钥与敏感 cookie
- 修改数据库相关逻辑时，同时校对 `supabase/schema.sql` 与 `lib/types.ts`

## 快速定位入口

- 路由与页面：`app/`
- 后台管理：`app/admin/` + `components/admin/`
- Supabase：`lib/supabase/` + `supabase/schema.sql`
- 富文本：`components/tiptap-editor.tsx`
- SEO/RSS：`app/rss.xml/route.ts`、`app/sitemap.ts`

## 标准工作流

1. 先读 `skills/my-blog-dev/references/architecture.md`，确认涉及的目录/路由与数据链路
2. 根据任务类型选择参考：
   - 日常开发与变更清单：`skills/my-blog-dev/references/workflows.md`
   - Supabase/RLS：`skills/my-blog-dev/references/supabase.md`
   - 内容/TipTap：`skills/my-blog-dev/references/content.md`
3. 实现时遵循：
   - 页面/数据：优先在 Server Component 直接查询并渲染
   - 写入/交互：放在 Client Component 中，用浏览器 Supabase client 执行
   - 后台：默认受 middleware 守卫，登录态来自 Supabase Auth
4. 完成后验证：
   - `npm run lint`
   - `npm run build`

## 附带脚本

- 环境变量检查：运行 `node skills/my-blog-dev/scripts/check-env.mjs`
