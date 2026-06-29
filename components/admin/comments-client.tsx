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
  Check,
  FileText,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Comment } from "@/lib/types";

type CommentRow = Comment & { post?: { title: string } | null };
type StatusFilter = "all" | "pending" | "approved";
type SortKey = "newest" | "oldest" | "author";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getCommentStatus(comment: CommentRow) {
  return comment.approved ? "approved" : "pending";
}

function statusLabel(status: StatusFilter) {
  if (status === "approved") return "已审核";
  if (status === "pending") return "待审核";
  return "全部状态";
}

function sortComments(comments: CommentRow[], sortKey: SortKey) {
  return [...comments].sort((a, b) => {
    if (sortKey === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortKey === "author") {
      return a.author_name.localeCompare(b.author_name, "zh-CN");
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function AdminCommentsClient({
  initialComments,
}: {
  initialComments: CommentRow[];
}) {
  const [comments, setComments] = useState<CommentRow[]>(initialComments);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = comments.filter((comment) => !comment.approved).length;
    const approved = comments.length - pending;
    const postCount = new Set(comments.map((comment) => comment.post_id)).size;
    return {
      total: comments.length,
      pending,
      approved,
      postCount,
    };
  }, [comments]);

  const filteredComments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = comments.filter((comment) => {
      const matchesStatus =
        statusFilter === "all" || getCommentStatus(comment) === statusFilter;
      const searchText = [
        comment.author_name,
        comment.author_email,
        comment.content,
        comment.post?.title || "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || searchText.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });

    return sortComments(filtered, sortKey);
  }, [comments, query, sortKey, statusFilter]);

  const hasFilters =
    query.trim().length > 0 || statusFilter !== "all" || sortKey !== "newest";

  const fetchComments = async () => {
    setRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .select("*, post:posts(title)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("加载失败: " + error.message);
      setRefreshing(false);
      return;
    }

    setComments((data || []) as CommentRow[]);
    setRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      toast.error("操作失败: " + error.message);
      setApprovingId(null);
      return;
    }

    toast.success("评论已审核通过");
    await fetchComments();
    setApprovingId(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      setDeletingId(null);
      return;
    }

    toast.success("评论已删除");
    await fetchComments();
    setDeletingId(null);
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setSortKey("newest");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Moderation"
        title="评论管理"
        description="审核、查看和清理文章评论。"
      />

      {comments.length > 0 ? (
        <>
          <AdminSummaryLedger
            aria-label="评论管理摘要"
            items={[
              {
                label: "全部评论",
                value: numberFormatter.format(stats.total),
                helper: "站点评论总量",
              },
              {
                label: "待审核",
                value: numberFormatter.format(stats.pending),
                helper: "需要处理的评论",
                tone: stats.pending > 0 ? "attention" : "default",
              },
              {
                label: "已审核",
                value: numberFormatter.format(stats.approved),
                helper: "已通过的评论",
              },
              {
                label: "涉及文章",
                value: numberFormatter.format(stats.postCount),
                helper: "评论关联的内容数",
              },
            ]}
          />

          <section className="border bg-card">
            <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  suppressHydrationWarning
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索作者、邮箱、内容或文章"
                  className="pl-9"
                  aria-label="搜索评论"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as StatusFilter)
                  }
                >
                  <SelectTrigger className="w-full lg:w-[132px]" aria-label="筛选审核状态">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="approved">已审核</SelectItem>
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
                    <SelectItem value="author">作者 A-Z</SelectItem>
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
                    aria-label="刷新评论列表"
                    disabled={refreshing}
                    onClick={fetchComments}
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
                当前显示 {numberFormatter.format(filteredComments.length)} /{" "}
                {numberFormatter.format(comments.length)} 条
              </span>
              <span>{statusLabel(statusFilter)}</span>
            </div>
          </section>

          {refreshing && filteredComments.length === 0 ? (
            <CommentsLoadingState />
          ) : null}

          {filteredComments.length > 0 ? (
            <>
              <AdminTableSurface className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>评论者</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead>文章</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments.map((comment) => (
                      <TableRow key={comment.id} className="hover:bg-muted/40">
                        <TableCell className="max-w-[220px]">
                          <div className="min-w-0 space-y-1">
                            <div className="truncate font-medium">
                              {comment.author_name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {comment.author_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[360px]">
                          <p className="line-clamp-2 text-sm leading-6">
                            {comment.content}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          {comment.post?.title ? (
                            <Link
                              href={`/admin/posts/${comment.post_id}/edit`}
                              className="block truncate text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                              {comment.post.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <CommentStatusBadge approved={comment.approved} />
                        </TableCell>
                        <TableCell>{formatDate(comment.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <CommentActions
                            comment={comment}
                            approving={approvingId === comment.id}
                            deleting={deletingId === comment.id}
                            onApprove={handleApprove}
                            onDelete={handleDelete}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableSurface>

              <div className="grid gap-3 md:hidden">
                {filteredComments.map((comment) => (
                  <article
                    key={comment.id}
                    className="border bg-card p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="truncate text-sm font-medium">
                          {comment.author_name}
                        </div>
                        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail
                            className="h-3.5 w-3.5 shrink-0"
                            suppressHydrationWarning
                          />
                          <span className="truncate">{comment.author_email}</span>
                        </div>
                      </div>
                      <CommentActions
                        comment={comment}
                        approving={approvingId === comment.id}
                        deleting={deletingId === comment.id}
                        onApprove={handleApprove}
                        onDelete={handleDelete}
                      />
                    </div>

                    <p className="mt-3 line-clamp-4 text-sm leading-6">
                      {comment.content}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <CommentStatusBadge approved={comment.approved} />
                      <Badge
                        variant="outline"
                        className="max-w-full rounded-md font-normal"
                        asChild={Boolean(comment.post?.title)}
                      >
                        {comment.post?.title ? (
                          <Link href={`/admin/posts/${comment.post_id}/edit`}>
                            <FileText
                              className="h-3.5 w-3.5"
                              suppressHydrationWarning
                            />
                            <span className="truncate">{comment.post.title}</span>
                          </Link>
                        ) : (
                          <>
                            <FileText
                              className="h-3.5 w-3.5"
                              suppressHydrationWarning
                            />
                            <span className="truncate">未关联文章</span>
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          className="h-3.5 w-3.5"
                          suppressHydrationWarning
                        />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <AdminEmptyState
              icon={Search}
              title="没有匹配的评论"
              description="调整搜索关键词或审核状态后再试。"
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
          icon={MessageSquare}
          title="暂无评论"
          description="读者提交评论后，会在这里进行审核和管理。"
        />
      )}
    </div>
  );
}

function CommentStatusBadge({ approved }: { approved: boolean }) {
  return (
    <Badge variant={approved ? "default" : "secondary"} className="rounded-sm">
      {approved ? "已审核" : "待审核"}
    </Badge>
  );
}

function CommentActions({
  comment,
  approving,
  deleting,
  onApprove,
  onDelete,
}: {
  comment: CommentRow;
  approving: boolean;
  deleting: boolean;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {!comment.approved ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`审核通过 ${comment.author_name} 的评论`}
          disabled={approving || deleting}
          onClick={() => onApprove(comment.id)}
        >
          <Check className="h-4 w-4 text-foreground" suppressHydrationWarning />
        </Button>
      ) : null}
      <ConfirmActionDialog
        title="删除评论"
        description={`确定要删除 ${comment.author_name} 的这条评论吗？该操作无法撤销。`}
        confirmLabel="删除"
        loading={deleting}
        disabled={approving || deleting}
        onConfirm={() => onDelete(comment.id)}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`删除 ${comment.author_name} 的评论`}
          disabled={approving || deleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" suppressHydrationWarning />
        </Button>
      </ConfirmActionDialog>
    </div>
  );
}

function CommentsLoadingState() {
  return (
    <div className="border bg-card p-4" aria-live="polite">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3">
            <div className="h-9 w-40 rounded-md bg-muted" />
            <div className="h-9 flex-1 rounded-md bg-muted" />
            <div className="hidden h-9 w-20 rounded-md bg-muted sm:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">正在刷新评论列表</span>
    </div>
  );
}
