# 内容与编辑器约定（TipTap + HTML）

## 存储格式

- 文章正文以 **HTML 字符串** 存在 `posts.content`
- 文章详情页直接渲染 HTML（`dangerouslySetInnerHTML`）

## 写作规范（建议）

- 标题层级按顺序使用（h2 → h3 → h4），避免跳级
- 代码块必须标明语言（便于高亮）
- 图片尽量使用可长期访问的 URL，避免临时链接
- 外链尽量使用 `https://`，并保证可访问
- 摘要 `excerpt` 是 SEO 与 RSS 的主要来源，建议控制在 80–160 字，并包含文章关键词

## 功能扩展提示

- 若需要新的富文本能力（如表格/任务列表/数学公式），在 `components/tiptap-editor.tsx` 增加对应 extension
- 一旦扩展 HTML 输出能力，前台渲染与样式（`app/globals.css` + typography）可能需要同步调整
