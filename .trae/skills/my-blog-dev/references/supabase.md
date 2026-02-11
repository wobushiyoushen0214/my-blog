# Supabase（表结构与权限要点）

## 核心表（摘要）

- `posts`：文章主表（`title/slug/content/excerpt/cover_image/published/category_id/view_count/...`）
- `categories`：分类
- `tags`：标签
- `post_tags`：文章-标签多对多
- `comments`：评论（含 `approved` 审核字段）

对应 SQL：`supabase/schema.sql`  
对应前端类型：`lib/types.ts`

## RLS 策略（当前项目的意图）

- 公开（anon）可读：
  - `posts`：仅 `published = true`
  - `categories/tags/post_tags`：可读
  - `comments`：仅 `approved = true`
- 公开（anon）可写：
  - `comments`：允许插入（用于前台匿名评论提交）
- 登录用户（authenticated）：
  - 对上述内容拥有完整管理权限（insert/update/delete/read）

## 常见改动注意点

- **新增字段**：改 SQL 后同步改 `lib/types.ts`，并检查所有 select/insert/update 的字段列表
- **新增表**：默认开启 RLS，并补齐：
  - 公开读策略（如果需要）
  - `authenticated` 管理策略
- **评论安全**：匿名插入策略要谨慎，避免泄露敏感字段；前台只展示 `approved=true`
