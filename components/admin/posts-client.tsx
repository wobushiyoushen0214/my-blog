"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSummaryLedger,
  AdminTableSurface,
} from "@/components/admin/admin-page";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Eye,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";

type PostRow = Post & { category?: { name: string } | null };
type StatusFilter = "all" | "published" | "draft";
type SortKey = "newest" | "oldest" | "views" | "title";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getPostStatus(post: PostRow) {
  return post.published ? "published" : "draft";
}

function statusLabel(status: StatusFilter) {
  if (status === "published") return "已发布";
  if (status === "draft") return "草稿";
  return "全部状态";
}

function sortPosts(posts: PostRow[], sortKey: SortKey) {
  return [...posts].sort((a, b) => {
    if (sortKey === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortKey === "views") {
      return (b.view_count || 0) - (a.view_count || 0);
    }
    if (sortKey === "title") {
      return a.title.localeCompare(b.title, "zh-CN");
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function AdminPostsClient({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const names = new Set<string>();
    posts.forEach((post) => {
      if (post.category?.name) names.add(post.category.name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [posts]);

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.published).length;
    const draft = posts.length - published;
    const views = posts.reduce((sum, post) => sum + (post.view_count || 0), 0);
    return {
      total: posts.length,
      published,
      draft,
      views,
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" || getPostStatus(post) === statusFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && !post.category?.name) ||
        post.category?.name === categoryFilter;
      const searchText = [
        post.title,
        post.excerpt,
        post.category?.name || "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || searchText.includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesQuery;
    });

    return sortPosts(filtered, sortKey);
  }, [categoryFilter, posts, query, sortKey, statusFilter]);

  const hasFilters =
    query.trim().length > 0 ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    sortKey !== "newest";

  const fetchPosts = async () => {
    setRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, category:categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("加载失败: " + error.message);
      setRefreshing(false);
      return;
    }

    setPosts((data || []) as PostRow[]);
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("post_tags").delete().eq("post_id", id);
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      setDeletingId(null);
      return;
    }

    toast.success("文章已删除");
    await fetchPosts();
    setDeletingId(null);
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortKey("newest");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Content"
        title="文章管理"
        description="管理文章和见闻的发布状态、分类与基础数据。"
        action={
          <Button asChild>
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" suppressHydrationWarning />
              新建文章
            </Link>
          </Button>
        }
      />

      {posts.length > 0 ? (
        <>
          <AdminSummaryLedger
            aria-label="文章管理摘要"
            items={[
              {
                label: "全部内容",
                value: numberFormatter.format(stats.total),
                helper: "当前可管理的文章和见闻",
              },
              {
                label: "已发布",
                value: numberFormatter.format(stats.published),
                helper: "已在前台公开显示",
                tone: "primary",
              },
              {
                label: "草稿",
                value: numberFormatter.format(stats.draft),
                helper: "仍在后台保存",
              },
              {
                label: "总阅读量",
                value: numberFormatter.format(stats.views),
                helper: "所有内容累计阅读",
              },
            ]}
          />

          <section className="border bg-card">
            <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  suppressHydrationWarning
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、摘要或分类"
                  className="pl-9"
                  aria-label="搜索文章"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as StatusFilter)
                  }
                >
                  <SelectTrigger className="w-full lg:w-[132px]" aria-label="筛选发布状态">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-[148px]" aria-label="筛选分类">
                    <SelectValue placeholder="全部分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="uncategorized">无分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sortKey}
                  onValueChange={(value) => setSortKey(value as SortKey)}
                >
                  <SelectTrigger className="w-full lg:w-[132px]" aria-label="排序">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新优先</SelectItem>
                    <SelectItem value="oldest">最早优先</SelectItem>
                    <SelectItem value="views">阅读量高</SelectItem>
                    <SelectItem value="title">标题 A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 lg:flex-none"
                    disabled={!hasFilters}
                    onClick={resetFilters}
                  >
                    重置
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="刷新文章列表"
                    disabled={refreshing}
                    onClick={fetchPosts}
                  >
                    <RefreshCw
                      className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                      suppressHydrationWarning
                    />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                当前显示 {numberFormatter.format(filteredPosts.length)} /{" "}
                {numberFormatter.format(posts.length)} 篇
              </span>
              <span>
                {statusLabel(statusFilter)}
                {categoryFilter !== "all"
                  ? ` · ${
                      categoryFilter === "uncategorized"
                        ? "无分类"
                        : categoryFilter
                    }`
                  : ""}
              </span>
            </div>
          </section>

          {refreshing && filteredPosts.length === 0 ? <PostsLoadingState /> : null}

          {filteredPosts.length > 0 ? (
            <>
              <AdminTableSurface className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">阅读量</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post.id} className="hover:bg-muted/40">
                        <TableCell className="max-w-[420px]">
                          <div className="min-w-0 space-y-1">
                            <Link
                              href={`/admin/posts/${post.id}/edit`}
                              className="block truncate font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                              {post.title}
                            </Link>
                            {post.excerpt ? (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {post.excerpt}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {post.category?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <PostStatusBadge published={post.published} />
                        </TableCell>
                        <TableCell className="text-right">
                          {numberFormatter.format(post.view_count || 0)}
                        </TableCell>
                        <TableCell>{formatDate(post.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            post={post}
                            deleting={deletingId === post.id}
                            onDelete={handleDelete}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableSurface>

              <div className="divide-y border bg-card md:hidden">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="px-3 py-3 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="line-clamp-2 text-sm font-medium leading-6 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          {post.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <PostStatusBadge published={post.published} />
                          <Badge variant="outline" className="max-w-[160px] truncate rounded-md font-normal">
                            {post.category?.name || "无分类"}
                          </Badge>
                        </div>
                      </div>
                      <RowActions
                        post={post}
                        deleting={deletingId === post.id}
                        onDelete={handleDelete}
                      />
                    </div>

                    {post.excerpt ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {post.excerpt}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" suppressHydrationWarning />
                        {numberFormatter.format(post.view_count || 0)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          className="h-3.5 w-3.5"
                          suppressHydrationWarning
                        />
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <AdminEmptyState
              icon={Search}
              title="没有匹配的文章"
              description="调整搜索关键词、发布状态或分类筛选后再试。"
              action={
                <Button type="button" variant="outline" onClick={resetFilters}>
                  清除筛选
                </Button>
              }
            />
          )}
        </>
      ) : (
        <AdminEmptyState
          icon={FileText}
          title="暂无文章"
          description="创建第一篇内容后，可以在这里管理发布状态和阅读数据。"
          action={
            <Button asChild>
              <Link href="/admin/posts/new">
                <Plus className="h-4 w-4" suppressHydrationWarning />
                新建文章
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function PostStatusBadge({ published }: { published: boolean }) {
  return (
    <Badge variant={published ? "default" : "secondary"} className="rounded-sm">
      {published ? "已发布" : "草稿"}
    </Badge>
  );
}

function RowActions({
  post,
  deleting,
  onDelete,
}: {
  post: PostRow;
  deleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href={`/admin/posts/${post.id}/edit`} aria-label={`编辑 ${post.title}`}>
          <Pencil className="h-4 w-4" suppressHydrationWarning />
        </Link>
      </Button>
      <ConfirmActionDialog
        title="删除文章"
        description={`确定要删除「${post.title}」吗？该操作无法撤销。`}
        confirmLabel="删除"
        loading={deleting}
        disabled={deleting}
        onConfirm={() => onDelete(post.id)}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`删除 ${post.title}`}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" suppressHydrationWarning />
        </Button>
      </ConfirmActionDialog>
    </div>
  );
}

function PostsLoadingState() {
  return (
    <div className="border bg-card p-4" aria-live="polite">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3">
            <div className="h-9 flex-1 rounded-md bg-muted" />
            <div className="hidden h-9 w-24 rounded-md bg-muted sm:block" />
            <div className="h-9 w-16 rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <span className="sr-only">正在刷新文章列表</span>
    </div>
  );
}
