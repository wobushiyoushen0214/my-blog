import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Eye,
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type RecentPost = {
  id: string;
  title: string;
  published: boolean | null;
  view_count: number | null;
  created_at: string;
  updated_at: string | null;
  categoryName: string | null;
};

type PendingComment = {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
  postTitle: string | null;
};

type Relation<T> = T | T[] | null | undefined;

type RecentPostRow = Omit<RecentPost, "categoryName"> & {
  category?: Relation<{ name: string | null }>;
};

type PendingCommentRow = Omit<PendingComment, "postTitle"> & {
  post?: Relation<{ title: string | null }>;
};

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatNumber(value: number | null | undefined) {
  return numberFormatter.format(value || 0);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function firstRelation<T>(relation: Relation<T>) {
  if (Array.isArray(relation)) return relation[0] || null;
  return relation || null;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: postCount },
    { count: publishedCount },
    { count: draftCount },
    { count: categoryCount },
    { count: postCategoryCount },
    { count: momentCategoryCount },
    { count: tagCount },
    { count: commentCount },
    { count: pendingCommentCount },
    { data: viewsData },
    { data: recentPostsData },
    { data: pendingCommentsData },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("published", false),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("type", "post"),
    supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("type", "moment"),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("approved", false),
    supabase.from("posts").select("view_count"),
    supabase
      .from("posts")
      .select(
        "id,title,published,view_count,created_at,updated_at,category:categories(name)"
      )
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("comments")
      .select("id,post_id,author_name,content,created_at,post:posts(title)")
      .eq("approved", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalViews = (viewsData || []).reduce(
    (sum, post) => sum + (post.view_count || 0),
    0
  );
  const recentPosts = (
    (recentPostsData || []) as unknown as RecentPostRow[]
  ).map((post) => ({
    id: post.id,
    title: post.title,
    published: post.published,
    view_count: post.view_count,
    created_at: post.created_at,
    updated_at: post.updated_at,
    categoryName: firstRelation(post.category)?.name || null,
  }));
  const pendingComments = (
    (pendingCommentsData || []) as unknown as PendingCommentRow[]
  ).map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    author_name: comment.author_name,
    content: comment.content,
    created_at: comment.created_at,
    postTitle: firstRelation(comment.post)?.title || null,
  }));
  const pendingCount = pendingCommentCount || 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="站点内容、分类、标签和评论的当前概览。"
        action={
          <Button asChild>
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" suppressHydrationWarning />
              新建文章
            </Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="内容总数"
          value={formatNumber(postCount)}
          helper={`${formatNumber(publishedCount)} 已发布 · ${formatNumber(
            draftCount
          )} 草稿`}
          href="/admin/posts"
          icon={FileText}
        />
        <MetricTile
          label="待审核评论"
          value={formatNumber(pendingCount)}
          helper={`${formatNumber(commentCount)} 条评论总量`}
          href="/admin/comments"
          icon={MessageSquare}
          attention={pendingCount > 0}
        />
        <MetricTile
          label="总阅读量"
          value={formatNumber(totalViews)}
          helper="来自所有内容累计"
          href="/admin/posts"
          icon={Eye}
        />
        <MetricTile
          label="内容结构"
          value={`${formatNumber(categoryCount)} / ${formatNumber(tagCount)}`}
          helper="分类 / 标签"
          href="/admin/categories"
          icon={FolderOpen}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel
          title="待处理评论"
          description={
            pendingCount > 0
              ? "优先审核最近提交的评论，减少前台等待。"
              : "当前没有待审核评论。"
          }
          actionHref="/admin/comments"
          actionLabel="管理评论"
        >
          {pendingComments.length > 0 ? (
            <div className="divide-y">
              {pendingComments.map((comment) => (
                <Link
                  key={comment.id}
                  href="/admin/comments"
                  className="block px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {comment.author_name}
                        </span>
                        <Badge variant="secondary" className="rounded-md">
                          待审核
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {comment.content}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {comment.postTitle || "未关联文章"} ·{" "}
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                      suppressHydrationWarning
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <PanelEmpty
              title="评论队列已清空"
              description="新的读者评论会出现在这里，便于集中审核。"
            />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="快速操作"
          description="常用管理入口集中在这里。"
        >
          <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1">
            <QuickAction
              href="/admin/posts/new"
              icon={Plus}
              title="新建文章"
              description="创建长文或见闻内容"
            />
            <QuickAction
              href="/admin/posts"
              icon={FileText}
              title="管理内容"
              description="筛选草稿、发布内容和阅读数据"
            />
            <QuickAction
              href="/admin/categories"
              icon={FolderOpen}
              title="维护分类"
              description={`${formatNumber(postCategoryCount)} 文章分类 · ${formatNumber(
                momentCategoryCount
              )} 见闻分类`}
            />
            <QuickAction
              href="/admin/tags"
              icon={Tags}
              title="维护标签"
              description={`${formatNumber(tagCount)} 个关键词标签`}
            />
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel
          title="最近更新"
          description="按更新时间排序，便于继续编辑或检查发布状态。"
          actionHref="/admin/posts"
          actionLabel="查看全部"
        >
          {recentPosts.length > 0 ? (
            <div className="divide-y">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/posts/${post.id}/edit`}
                  className="block px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {post.title}
                        </span>
                        <Badge
                          variant={post.published ? "default" : "secondary"}
                          className="rounded-md"
                        >
                          {post.published ? "已发布" : "草稿"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {post.categoryName || "无分类"} ·{" "}
                        {formatDate(post.updated_at || post.created_at)} 更新 ·{" "}
                        {formatNumber(post.view_count)} 阅读
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                      suppressHydrationWarning
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <PanelEmpty
              title="暂无内容"
              description="创建第一篇内容后，最近更新会展示在这里。"
              actionHref="/admin/posts/new"
              actionLabel="新建文章"
            />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="内容结构"
          description="检查分类和标签是否足够支撑当前内容。"
        >
          <div className="space-y-3 p-4">
            <StructureRow
              label="文章分类"
              value={formatNumber(postCategoryCount)}
              href="/admin/categories"
            />
            <StructureRow
              label="见闻分类"
              value={formatNumber(momentCategoryCount)}
              href="/admin/categories"
            />
            <StructureRow
              label="标签"
              value={formatNumber(tagCount)}
              href="/admin/tags"
            />
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  helper,
  href,
  icon: Icon,
  attention = false,
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
  icon: LucideIcon;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={
              attention
                ? "mt-1 text-2xl font-semibold tracking-tight text-primary"
                : "mt-1 text-2xl font-semibold tracking-tight"
            }
          >
            {value}
          </p>
        </div>
        <Icon
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
          suppressHydrationWarning
        />
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{helper}</p>
    </Link>
  );
}

function DashboardPanel({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-md border bg-background px-3 py-3 transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground">
        <Icon className="h-4 w-4" suppressHydrationWarning />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </Link>
  );
}

function StructureRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </Link>
  );
}

function PanelEmpty({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button className="mt-4" size="sm" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
