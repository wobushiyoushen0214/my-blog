-- 1. Categories 表增加 type 字段，区分 'post' (文章) 和 'moment' (见闻)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'post';

-- 2. Comments 表增加 parent_id 字段，支持评论回复
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 3. (可选) 为 type 字段创建索引
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
